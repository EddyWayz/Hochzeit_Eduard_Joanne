/**
 * Calendar Functions
 * Generates calendar links for Google Calendar and ICS download
 */

const EVENT_DETAILS = {
    title: 'Hochzeit Eduard & Joanne',
    description: 'Wir heiraten! Trauung, Sektempfang und Party.',
    location: 'Schlosskirche Berlin, Schlossplatz 1, 10178 Berlin',
    start: '20250615T140000',
    end: '20250616T020000', // Assuming party goes until 2 AM
    ctz: 'Europe/Berlin'
};

function addToGoogleCalendar() {
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', EVENT_DETAILS.title);
    url.searchParams.append('dates', `${EVENT_DETAILS.start}/${EVENT_DETAILS.end}`);
    url.searchParams.append('details', EVENT_DETAILS.description);
    url.searchParams.append('location', EVENT_DETAILS.location);
    url.searchParams.append('ctz', EVENT_DETAILS.ctz);

    window.open(url.toString(), '_blank');
}

function downloadICS() {
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Eduard & Joanne//Wedding Website//DE',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `SUMMARY:${EVENT_DETAILS.title}`,
        `DTSTART:${EVENT_DETAILS.start}`,
        `DTEND:${EVENT_DETAILS.end}`,
        `LOCATION:${EVENT_DETAILS.location}`,
        `DESCRIPTION:${EVENT_DETAILS.description}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'hochzeit-eduard-joanne.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
