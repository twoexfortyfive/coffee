from __future__ import annotations

import argparse
import csv
import io
import json
from datetime import datetime
from typing import Any

from flask import (
    Flask,
    flash,
    redirect,
    render_template,
    request,
    url_for,
)
from sqlalchemy import func, or_
from werkzeug.utils import secure_filename

from models import Coffee, Tag, db


ALLOWED_SERVE = {"BLACK", "WITH_MILK"}
REQUIRED_FIELDS = ["date", "company", "name", "country", "process", "rating"]


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///coffee.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = "dev-secret-key"

    db.init_app(app)

    with app.app_context():
        db.create_all()

    @app.route("/")
    def index() -> Any:
        return redirect(url_for("coffees"))

    @app.route("/coffees")
    def coffees() -> Any:
        search = request.args.get("search", "").strip()
        country = request.args.get("country", "")
        process = request.args.get("process", "")
        brew_method = request.args.get("brew_method", "")
        serve = request.args.get("serve", "")
        rating_min = request.args.get("rating_min", "")
        sort = request.args.get("sort", "date_desc")

        query = Coffee.query

        if search:
            like = f"%{search}%"
            query = query.filter(
                or_(
                    Coffee.company.ilike(like),
                    Coffee.name.ilike(like),
                    Coffee.country.ilike(like),
                    Coffee.process.ilike(like),
                    Coffee.cup_profile_raw.ilike(like),
                    Coffee.notes.ilike(like),
                )
            )

        if country:
            query = query.filter(Coffee.country == country)
        if process:
            query = query.filter(Coffee.process == process)
        if brew_method:
            query = query.filter(Coffee.brew_method == brew_method)
        if serve:
            query = query.filter(Coffee.serve == serve)
        if rating_min:
            try:
                rating_value = float(rating_min)
                query = query.filter(Coffee.rating >= rating_value)
            except ValueError:
                pass

        if sort == "rating_desc":
            query = query.order_by(Coffee.rating.desc(), Coffee.date.desc())
        else:
            query = query.order_by(Coffee.date.desc())

        coffees_list = query.all()

        countries = [row[0] for row in db.session.query(Coffee.country).distinct().order_by(Coffee.country).all()]
        processes = [row[0] for row in db.session.query(Coffee.process).distinct().order_by(Coffee.process).all()]
        brew_methods = [
            row[0]
            for row in db.session.query(Coffee.brew_method)
            .filter(Coffee.brew_method.isnot(None))
            .distinct()
            .order_by(Coffee.brew_method)
            .all()
        ]

        return render_template(
            "coffees.html",
            coffees=coffees_list,
            countries=countries,
            processes=processes,
            brew_methods=brew_methods,
            filters={
                "search": search,
                "country": country,
                "process": process,
                "brew_method": brew_method,
                "serve": serve,
                "rating_min": rating_min,
                "sort": sort,
            },
        )

    @app.route("/coffees/new", methods=["GET", "POST"])
    def coffee_new() -> Any:
        if request.method == "POST":
            data, errors = validate_form(request.form)
            if errors:
                return render_template("coffee_form.html", coffee=None, errors=errors, values=data)

            coffee = Coffee(**data)
            sync_tags(coffee, data.get("cup_profile_raw"))
            db.session.add(coffee)
            db.session.commit()
            flash("Coffee added.")
            return redirect(url_for("coffees"))

        return render_template("coffee_form.html", coffee=None, errors={}, values={})

    @app.route("/coffees/<int:coffee_id>")
    def coffee_detail(coffee_id: int) -> Any:
        coffee = Coffee.query.get_or_404(coffee_id)
        return render_template("coffee_detail.html", coffee=coffee)

    @app.route("/coffees/<int:coffee_id>/edit", methods=["GET", "POST"])
    def coffee_edit(coffee_id: int) -> Any:
        coffee = Coffee.query.get_or_404(coffee_id)
        if request.method == "POST":
            data, errors = validate_form(request.form)
            if errors:
                return render_template(
                    "coffee_form.html", coffee=coffee, errors=errors, values=data
                )

            for key, value in data.items():
                setattr(coffee, key, value)
            sync_tags(coffee, data.get("cup_profile_raw"))
            db.session.commit()
            flash("Coffee updated.")
            return redirect(url_for("coffee_detail", coffee_id=coffee.id))

        values = coffee_to_form(coffee)
        return render_template("coffee_form.html", coffee=coffee, errors={}, values=values)

    @app.route("/coffees/<int:coffee_id>/delete", methods=["POST"])
    def coffee_delete(coffee_id: int) -> Any:
        coffee = Coffee.query.get_or_404(coffee_id)
        db.session.delete(coffee)
        db.session.commit()
        flash("Coffee deleted.")
        return redirect(url_for("coffees"))

    @app.route("/import", methods=["GET", "POST"])
    def import_csv() -> Any:
        preview_rows: list[dict[str, Any]] = []
        errors: list[str] = []
        rows_json = ""

        if request.method == "POST":
            if request.form.get("confirm") == "1":
                rows_json = request.form.get("rows_json", "")
                try:
                    rows = json.loads(rows_json)
                    import_rows(rows)
                    flash("CSV imported successfully.")
                    return redirect(url_for("coffees"))
                except (json.JSONDecodeError, ValueError) as exc:
                    errors.append(f"Could not import rows: {exc}")
            else:
                file = request.files.get("csv_file")
                if not file or file.filename == "":
                    errors.append("Please choose a CSV file.")
                else:
                    filename = secure_filename(file.filename)
                    if not filename.lower().endswith(".csv"):
                        errors.append("Please upload a .csv file.")
                    else:
                        content = file.read().decode("utf-8")
                        preview_rows, errors, rows_json = parse_csv_preview(content)

        return render_template(
            "import.html",
            preview_rows=preview_rows,
            errors=errors,
            rows_json=rows_json,
        )

    @app.route("/insights")
    def insights() -> Any:
        top_processes = (
            db.session.query(Coffee.process, func.avg(Coffee.rating))
            .group_by(Coffee.process)
            .order_by(func.avg(Coffee.rating).desc())
            .limit(5)
            .all()
        )
        top_countries = (
            db.session.query(Coffee.country, func.avg(Coffee.rating))
            .group_by(Coffee.country)
            .order_by(func.avg(Coffee.rating).desc())
            .limit(5)
            .all()
        )
        top_tags = (
            db.session.query(Tag.name, func.count(Tag.id))
            .join(Tag.coffees)
            .group_by(Tag.name)
            .order_by(func.count(Tag.id).desc())
            .limit(10)
            .all()
        )
        highest_rated = (
            Coffee.query.order_by(Coffee.rating.desc(), Coffee.date.desc()).limit(10).all()
        )

        return render_template(
            "insights.html",
            top_processes=top_processes,
            top_countries=top_countries,
            top_tags=top_tags,
            highest_rated=highest_rated,
        )

    return app


def coffee_to_form(coffee: Coffee) -> dict[str, Any]:
    return {
        "date": coffee.date.strftime("%Y-%m-%d"),
        "company": coffee.company,
        "name": coffee.name,
        "coffee_region": coffee.coffee_region or "",
        "country": coffee.country,
        "location": coffee.location or "",
        "altitude": coffee.altitude or "",
        "process": coffee.process,
        "varietal": coffee.varietal or "",
        "cup_profile": coffee.cup_profile_raw or "",
        "grind_setting": "" if coffee.grind_setting is None else str(coffee.grind_setting),
        "brew_method": coffee.brew_method or "",
        "serve": coffee.serve or "",
        "rating": str(coffee.rating),
        "notes": coffee.notes or "",
        "nicholas_notes": coffee.nicholas_notes or "",
    }


def validate_form(form: Any) -> tuple[dict[str, Any], dict[str, str]]:
    errors: dict[str, str] = {}
    data: dict[str, Any] = {}

    for field in REQUIRED_FIELDS:
        if not form.get(field, "").strip():
            errors[field] = "This field is required."

    date_value = form.get("date", "").strip()
    try:
        data["date"] = datetime.strptime(date_value, "%Y-%m-%d").date()
    except ValueError:
        errors["date"] = "Enter a valid date (YYYY-MM-DD)."
        data["date"] = date_value

    rating_value = form.get("rating", "").strip()
    try:
        rating = float(rating_value)
        if rating < 1 or rating > 5 or (rating * 2) % 1 != 0:
            raise ValueError
        data["rating"] = rating
    except ValueError:
        errors["rating"] = "Rating must be 1–5 in 0.5 steps."
        data["rating"] = rating_value

    serve_value = form.get("serve", "").strip()
    if serve_value and serve_value not in ALLOWED_SERVE:
        errors["serve"] = "Serve must be BLACK or WITH_MILK."
        serve_value = ""

    cup_profile = form.get("cup_profile", "").strip()
    if not cup_profile and form.get("cup_profile_raw"):
        cup_profile = form.get("cup_profile_raw", "").strip()

    data.update(
        {
            "company": form.get("company", "").strip(),
            "name": form.get("name", "").strip(),
            "coffee_region": form.get("coffee_region", "").strip() or None,
            "country": form.get("country", "").strip(),
            "location": form.get("location", "").strip() or None,
            "altitude": form.get("altitude", "").strip() or None,
            "process": form.get("process", "").strip(),
            "varietal": form.get("varietal", "").strip() or None,
            "cup_profile_raw": cup_profile or None,
            "brew_method": form.get("brew_method", "").strip() or None,
            "serve": serve_value or None,
            "notes": form.get("notes", "").strip() or None,
            "nicholas_notes": form.get("nicholas_notes", "").strip() or None,
        }
    )

    grind_setting = form.get("grind_setting", "").strip()
    if grind_setting:
        try:
            data["grind_setting"] = int(grind_setting)
        except ValueError:
            errors["grind_setting"] = "Grind setting must be a whole number."
            data["grind_setting"] = None
    else:
        data["grind_setting"] = None

    return data, errors


def parse_csv_preview(content: str) -> tuple[list[dict[str, Any]], list[str], str]:
    errors: list[str] = []
    preview_rows: list[dict[str, Any]] = []
    reader = csv.DictReader(io.StringIO(content))
    headers = [header.strip() for header in reader.fieldnames or []]

    missing = [field for field in REQUIRED_FIELDS if field not in headers]
    if missing:
        errors.append(f"Missing required columns: {', '.join(missing)}")
        return preview_rows, errors, ""

    rows: list[dict[str, Any]] = []
    for index, row in enumerate(reader, start=1):
        cleaned = {key: (value or "").strip() for key, value in row.items()}
        if "cup_profile" not in cleaned and "cup_profile_raw" in cleaned:
            cleaned["cup_profile"] = cleaned["cup_profile_raw"]
        row_errors = validate_csv_row(cleaned)
        if row_errors:
            errors.append(f"Row {index}: {', '.join(row_errors)}")
        rows.append(cleaned)

    preview_rows = rows[:20]
    rows_json = json.dumps(rows)
    return preview_rows, errors, rows_json


def validate_csv_row(row: dict[str, str]) -> list[str]:
    row_errors: list[str] = []
    for field in REQUIRED_FIELDS:
        if not row.get(field, "").strip():
            row_errors.append(f"{field} is required")

    if row.get("rating"):
        try:
            rating = float(row["rating"])
            if rating < 1 or rating > 5 or (rating * 2) % 1 != 0:
                raise ValueError
        except ValueError:
            row_errors.append("rating must be 1–5 in 0.5 steps")

    if row.get("serve") and row["serve"] not in ALLOWED_SERVE:
        row_errors.append("serve must be BLACK or WITH_MILK")

    return row_errors


def import_rows(rows: list[dict[str, str]]) -> None:
    for row in rows:
        data, errors = validate_form(row)
        if errors:
            raise ValueError("CSV contains invalid rows")
        coffee = Coffee(**data)
        sync_tags(coffee, data.get("cup_profile_raw"))
        db.session.add(coffee)
    db.session.commit()


def sync_tags(coffee: Coffee, cup_profile_raw: str | None) -> None:
    coffee.tags.clear()
    if not cup_profile_raw:
        return
    for tag_name in parse_tags(cup_profile_raw):
        tag = Tag.query.filter_by(name=tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            db.session.add(tag)
        coffee.tags.append(tag)


def parse_tags(cup_profile_raw: str) -> list[str]:
    tags = [part.strip().lower() for part in cup_profile_raw.split(",")]
    return [tag for tag in tags if tag]


def seed_database() -> None:
    if Coffee.query.first():
        return
    samples = [
        {
            "date": "2024-05-12",
            "company": "Atlas Coffee Club",
            "name": "Guatemala Huehuetenango",
            "country": "Guatemala",
            "process": "Washed",
            "cup_profile": "Citrus, Cacao, Almond",
            "rating": "4.5",
            "brew_method": "V60",
            "serve": "BLACK",
        },
        {
            "date": "2024-05-16",
            "company": "Onyx Coffee Lab",
            "name": "Colombia Aponte",
            "country": "Colombia",
            "process": "Honey",
            "cup_profile": "Cherry, Honey, Orange",
            "rating": "4.0",
            "brew_method": "Kalita",
            "serve": "BLACK",
        },
        {
            "date": "2024-05-21",
            "company": "Stumptown",
            "name": "Ethiopia Duromina",
            "country": "Ethiopia",
            "process": "Natural",
            "cup_profile": "Blueberry, Floral, Lemon",
            "rating": "4.5",
            "brew_method": "Chemex",
            "serve": "BLACK",
        },
        {
            "date": "2024-05-28",
            "company": "Blue Bottle",
            "name": "Kenya Nyeri",
            "country": "Kenya",
            "process": "Washed",
            "cup_profile": "Blackcurrant, Tomato, Brown Sugar",
            "rating": "4.0",
            "brew_method": "Espresso",
            "serve": "WITH_MILK",
        },
        {
            "date": "2024-06-02",
            "company": "Heart",
            "name": "Costa Rica La Rosa",
            "country": "Costa Rica",
            "process": "Anaerobic",
            "cup_profile": "Papaya, Peach, Violet",
            "rating": "4.5",
            "brew_method": "Aeropress",
            "serve": "BLACK",
        },
        {
            "date": "2024-06-08",
            "company": "Intelligentsia",
            "name": "Rwanda Karongi",
            "country": "Rwanda",
            "process": "Washed",
            "cup_profile": "Lime, Honey, Tea",
            "rating": "3.5",
            "brew_method": "French Press",
            "serve": "WITH_MILK",
        },
        {
            "date": "2024-06-14",
            "company": "Counter Culture",
            "name": "Peru Cajamarca",
            "country": "Peru",
            "process": "Washed",
            "cup_profile": "Chocolate, Nougat, Plum",
            "rating": "4.0",
            "brew_method": "Moka Pot",
            "serve": "BLACK",
        },
        {
            "date": "2024-06-20",
            "company": "Bird Rock",
            "name": "Indonesia Sumatra",
            "country": "Indonesia",
            "process": "Wet Hulled",
            "cup_profile": "Earthy, Dark Chocolate, Spice",
            "rating": "3.5",
            "brew_method": "Cold Brew",
            "serve": "BLACK",
        },
    ]

    for sample in samples:
        data, errors = validate_form(sample)
        if errors:
            continue
        coffee = Coffee(**data)
        sync_tags(coffee, data.get("cup_profile_raw"))
        db.session.add(coffee)

    db.session.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Coffee Diary MVP")
    parser.add_argument("--seed", action="store_true", help="Seed the database")
    args = parser.parse_args()

    app = create_app()

    if args.seed:
        with app.app_context():
            seed_database()
        return

    app.run(host="0.0.0.0", port=3000, debug=True)


if __name__ == "__main__":
    main()
