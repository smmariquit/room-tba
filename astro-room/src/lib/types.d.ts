export type AppData = {
  buildings: {
    [key: string]: {
      rooms: string[];
      directions: string;
      lat: number;
      lon: number;
      osm_link: string;
    };
  };
  colleges: {
    [key: string]: string[];
  };
  divisions: {
    [key: string]: string[];
  };
  rooms: {
    [key: string]: {
      building: string | null;
      college: string | null;
      division: string | null;
      classes: {
        course_code: string;
        section: string;
        type: "LAB" | "LEC" | "SEM";
        schedule: string[];
        course_title: string;
      }[];
    };
  };
};

type RoomData = {
    id: number;
    code: string;
    directions: string | null;
    building: {
        name: string;
        lat: number | null;
        lon: number | null;
        direction: string | null;
    } | null;
    collegeName: string | null;
    divisionName: string | null;
};