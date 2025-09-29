import React from "react";

const TEMPLATES = [
  { id: "wifi", title: "Wi-Fi QR", desc: "Share Wi-Fi SSID & password", sample: "WIFI:T:WPA;S:MyWifi;P:pass123;;" },
  { id: "vcard", title: "vCard", desc: "Share your contact", sample: "BEGIN:VCARD\nVERSION:3.0\nN:Doe;John\nTEL:+123456789\nEMAIL:john@example.com\nEND:VCARD" },
  { id: "event", title: "Event", desc: "Add to calendar", sample: "BEGIN:VEVENT\nSUMMARY:Meetup\nDTSTART:20251001T180000Z\nDTEND:20251001T190000Z\nEND:VEVENT" },
  { id: "payment", title: "Payment", desc: "Link to pay page", sample: "https://pay.example.com/you" },
  { id: "link", title: "Smart link", desc: "Add UTM for campaigns", sample: "https://example.com/?utm_source=qr&utm_medium=print&utm_campaign=fall" },
];

export default function TemplatesGallery() {
  return (
    <div className="grid three">
      {TEMPLATES.map(t => (
        <div className="card" key={t.id}>
          <b>{t.title}</b>
          <p className="muted">{t.desc}</p>
          <a className="btn" href={`/#?prefill=${encodeURIComponent(t.sample)}`}>Use template</a>
        </div>
      ))}
    </div>
  );
}