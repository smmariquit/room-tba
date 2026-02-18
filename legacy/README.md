# Room TBA - UPLB Room Finder

A web app to help UPLB students find rooms on campus. "Saan sa UPLB ang ___?" Finally answered.

## Features

- Search rooms by name, building, college, division, or course code
- Filter rooms by Building, College, or Division
- View room schedules with visual timetable display
- Building information with directions and OpenStreetMap integration
- Room-specific directions for commonly asked-about rooms
- Mobile-responsive design with accessibility features

## Data Source

Data is sourced from UPLB AMIS for 2nd Semester AY 2025-2026.

## Development

To run locally, open `index.html` in a browser or run a local server:
```
python -m http.server 8080
```

## Files

- `index.html` - Main web app
- `schedule-renderer.js` - Schedule rendering logic
- `app_data.json` - Processed data for the web app (buildings, rooms, classes)
- `changelog.html` - Version history

## License

MIT

## Author

Developed by [Simonee Ezekiel Mariquit](https://stimmie.dev)

## Contributors

- **Niño Anthony Marmeto** - Helped with Electrical Engineering building information
- **Rosh Almario** - Helped with Institute of Chemistry room directions
