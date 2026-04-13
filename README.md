# Room TBA - UPLB Room Finder

A web app to help UPLB students find rooms on campus. "Saan sa UPLB ang \_\_\_?" Finally answered.

## Features

- Search rooms by name, building, college, division
- Filter rooms by Building, College, or Division
- View room schedules with visual timetable display
- Building information with directions and OpenStreetMap integration
- Room-specific directions for commonly asked-about rooms
- Mobile-responsive design with accessibility features
- Offline support in cases where data is not accessible

## Data Source

Data is sourced from UPLB AMIS for 2nd Semester AY 2025-2026.

## Development/Contribution

To run locally, you need to download [Bun.js](https://bun.sh/) and run the following command:

```
bun dev
```

The data is stored in the info.db file, and may be accessed using sqlite. If you are not familiar with using SQL, you may run the following command to open up drizzle studio and start correcting data:

```
bunx drizzle-kit studio
```

After that, you may open a pull request and describe the changes.

## Project structure

This project uses [Astro](https://astro.build), and may have the following folders:

- `/public` - All the static assets that can be requested by the route
- `/src/routes` - All of the routes used by the website
- `/src/components` - All of the frontend components used by the website
- `/src/assets` - All other internal assets used by the program
- `/src/lib` - where helper Typescript functions are located

## License

[MIT License](LICENSE)

## Author

Developed by [Simonee Ezekiel Mariquit](https://stimmie.dev)

## Contributors

- **Niño Anthony Marmeto** - Helped with Electrical Engineering building information
- **Rosh Almario** - Helped with Institute of Chemistry room directions
- **Ken Ramiscal** - Helped with Developing the UI and offline support
- **Kalinaw Lukas Aom Bebis** - Helped with developing the UI and bug fixing
