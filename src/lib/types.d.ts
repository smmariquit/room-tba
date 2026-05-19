import type { QueryStoreState } from "./store.svelte";

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
    directions: string | null;
  } | null;
  collegeName: string | null;
  divisionName: string | null;
};

type BuildingData = {
  id: number;
  building_name: string;
  lat: number | null;
  lon: number | null;
  directions: string | null;
};

type ClassMapValue = {
  courseCode: string;
  roomCode: string | null;
  section: string;
  type: string;
  schedule: string;
  directions: string | null;
  courseTitle: string;
};

type CollegeData = {
  id: number;
  college_name: string;
};

type DivisionData = {
  id: number;
  division_name: string;
};

type DormData = {
  id: number;
  dorm_name: string;
  short_name: string | null;
  lat: number | null;
  lon: number | null;
  gender: string;
  capacity: number | null;
  managing_office: string | null;
  contact_email: string | null;
  amenities: string | null;
  osm_link: string | null;
  description: string | null;
  is_up_managed: boolean;
  price_range: string | null;
  contact_phone: string | null;
  facebook_link: string | null;
};

interface ContributorInfo {
  name: string;
  href?: string;
  img_alt?: string;
}

interface DeveloperInfo {
  name: string;
  href?: string;
  img_alt?: string;
}

interface RecentSearch {
  category: Exclude<QueryStoreState["category"], null>;
  value: string;
}
