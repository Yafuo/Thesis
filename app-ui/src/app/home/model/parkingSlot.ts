export class ParkingSlot {
  stationId: number;
  stationAddress: string;
  current: {
    userName: string;
    status: string;
    startTime: string;
    endTime: string;
  };
  future: [
    {
      userName: string;
      status: string;
      startTime: string;
      endTime: string;
    }
  ]
};
