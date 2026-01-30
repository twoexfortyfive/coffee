from datetime import datetime
from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


coffee_tags = db.Table(
    "coffee_tags",
    db.Column("coffee_id", db.Integer, db.ForeignKey("coffee.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tag.id"), primary_key=True),
)


class Coffee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    company = db.Column(db.String(120), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    coffee_region = db.Column(db.String(120))
    country = db.Column(db.String(120), nullable=False)
    location = db.Column(db.String(120))
    altitude = db.Column(db.String(120))
    process = db.Column(db.String(120), nullable=False)
    varietal = db.Column(db.String(120))
    cup_profile_raw = db.Column(db.Text)
    grind_setting = db.Column(db.Integer)
    brew_method = db.Column(db.String(120))
    serve = db.Column(db.String(20))
    rating = db.Column(db.Float, nullable=False)
    notes = db.Column(db.Text)
    nicholas_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    tags = db.relationship("Tag", secondary=coffee_tags, back_populates="coffees")

    def __repr__(self) -> str:
        return f"<Coffee {self.company} {self.name}>"


class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)

    coffees = db.relationship("Coffee", secondary=coffee_tags, back_populates="tags")

    def __repr__(self) -> str:
        return f"<Tag {self.name}>"
