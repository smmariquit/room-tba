type Room = {
    id: number;
    room_code: string;
    directions: string | null;
    building_id: number | null;
    college_id: number | null;
    division_id: number | null;
}

type Props = {
  rooms: Room[]
}

export const Rooms = ({rooms}: Props) => {
  console.log(rooms)
  return <div>
    {rooms.map(room => <div key={room.id}>{room.room_code}</div>)}
  </div>
}