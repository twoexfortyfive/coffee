# Coffee Diary MVP (Flask)

A beginner-friendly coffee diary built with Flask, SQLite, and SQLAlchemy.

## Project structure

```
app.py
models.py
templates/
  base.html
  coffees.html
  coffee_form.html
  coffee_detail.html
  import.html
  insights.html
static/
  styles.css
requirements.txt
```

## Run in Codespaces

```bash
pip install -r requirements.txt && python app.py
```

The app runs on http://localhost:3000 and creates `coffee.db` automatically on first run.

## Seed sample data

```bash
python app.py --seed
```

## Notes

- Required CSV columns: `date`, `company`, `name`, `country`, `process`, `rating`.
- Optional columns: `coffee_region`, `location`, `altitude`, `varietal`, `cup_profile`,
  `grind_setting`, `brew_method`, `serve`, `notes`, `nicholas_notes`.
- Serve values must be `BLACK` or `WITH_MILK`.
