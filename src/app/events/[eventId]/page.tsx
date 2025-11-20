export default function EventDetailsPage({ params }: { params: { eventId: string } }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Event Details</h1>
      <p>Details for event ID: {params.eventId}</p>
    </div>
  );
}
