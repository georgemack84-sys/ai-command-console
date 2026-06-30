import { EDGEBOOK_RESPONSIBLE_GAMBLING_DISCLAIMER } from "../responsible-gambling/disclaimer";

export function EdgeBookDashboard() {
  return (
    <section>
      <h1>EdgeBook</h1>
      <p>{EDGEBOOK_RESPONSIBLE_GAMBLING_DISCLAIMER}</p>
    </section>
  );
}
