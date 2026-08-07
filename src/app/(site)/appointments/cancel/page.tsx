import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { CancelAppointment } from "@/components/CancelAppointment";

export const metadata: Metadata = {
  title: "Cancel appointment",
  robots: { index: false, follow: false },
};

export default function CancelAppointmentPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return (
    <Container className="py-24">
      <div className="mx-auto max-w-md text-center">
        <CancelAppointment token={searchParams.token || ""} />
      </div>
    </Container>
  );
}
