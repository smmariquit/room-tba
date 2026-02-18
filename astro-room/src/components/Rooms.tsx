import type { RoomData } from "../lib/types";

type Props = {
  rooms: RoomData[];
};

export const Rooms = ({ rooms }: Props) => {
  console.log(rooms);
  return (
    <div>
      {rooms.map((room) => (
        <div key={room.id}>{room.code}</div>
      ))}
    </div>
  );
};
