// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: plane-departure;

// Japan Trip 2026 home-screen widget for the Scriptable app, medium size.
// Setup steps (in Thai): widgets/README.md. The data comes from /api/widget.

const SITE = "https://japan26.ast0miq.com";
// Paste WIDGET_TOKEN between the quotes on the phone only. Never commit the real
// value here: this repository is public.
const TOKEN = "ใส่ WIDGET_TOKEN ตรงนี้";
// Whose hotel to show: a key from lib/people.ts. The widget's Parameter field wins
// over this, so one copy of the script can serve several widgets.
const PERSON = "shokun";

const ink = new Color("#495867"), slate = new Color("#577399"), sky = new Color("#bdd5ea"), snow = new Color("#f7f7ff"), accent = new Color("#fe5f55");
const soft = new Color("#f7f7ff", 0.64);

const person = (args.widgetParameter || PERSON).trim();
const fm = FileManager.local();
const cachePath = fm.joinPath(fm.documentsDirectory(), `japan-trip-widget-${person}.json`);

// The last good answer is kept, so the widget still shows the plan when the phone has
// no signal, marked "ออฟไลน์" since the next activity may have moved on since. A
// refusal from the site (wrong token or name) is shown as is, never hidden by the cache.
async function load() {
  try {
    const request = new Request(`${SITE}/api/widget?person=${encodeURIComponent(person)}`);
    request.headers = { Authorization: `Bearer ${TOKEN}` };
    request.timeoutInterval = 15;
    const data = await request.loadJSON();
    if (request.response.statusCode !== 200) return { error: data.error || `HTTP ${request.response.statusCode}` };
    fm.writeString(cachePath, JSON.stringify(data));
    return { data };
  } catch {
    if (fm.fileExists(cachePath)) return { data: JSON.parse(fm.readString(cachePath)), offline: true };
    return { error: "โหลดไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่" };
  }
}

function text(stack, value, size, color, { medium = false, scale = 1 } = {}) {
  const t = stack.addText(value);
  t.font = medium ? Font.mediumSystemFont(size) : Font.systemFont(size);
  t.textColor = color;
  t.lineLimit = 1;
  t.minimumScaleFactor = scale;
  return t;
}

function build({ data, error, offline }) {
  const widget = new ListWidget();
  const gradient = new LinearGradient();
  gradient.colors = [ink, slate];
  gradient.locations = [0, 1];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(1, 1);
  widget.backgroundGradient = gradient;
  widget.setPadding(14, 16, 14, 16);
  widget.url = SITE;
  widget.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

  if (error) {
    text(widget, "Japan Trip", 12, soft);
    widget.addSpacer(6);
    const message = widget.addText(error);
    message.font = Font.systemFont(15);
    message.textColor = snow;
    return widget;
  }

  const small = config.widgetFamily === "small";
  // The countdown is the headline before the trip, and whenever the next thing on the
  // plan is that very flight. Otherwise it sits in the corner and the headline is the
  // next activity.
  const flightIsNext = data.next && data.flight && data.next.flight && data.next.date === data.flight.date && data.next.time === data.flight.time;
  const countdownFirst = data.flight && (!data.day || !data.next || flightIsNext);

  const head = widget.addStack();
  head.centerAlignContent();
  const where = data.day ? `DAY ${data.day.number} · ${data.day.title}` : data.trip;
  text(head, offline ? `${where} · ออฟไลน์` : where, 12, soft, { scale: 0.8 });
  head.addSpacer();
  if (data.flight && !countdownFirst && !small) {
    const pill = head.addStack();
    pill.backgroundColor = sky;
    pill.cornerRadius = 9;
    pill.setPadding(3, 8, 3, 8);
    text(pill, `${data.flight.label} ${data.flight.countdown}`, 11, ink, { medium: true });
  }

  widget.addSpacer();
  if (countdownFirst) {
    text(widget, `เที่ยวบิน${data.flight.label} · ${data.flight.when} ${data.flight.time} น.`, 12, soft, { scale: 0.8 });
    widget.addSpacer(2);
    text(widget, data.flight.countdown, 24, snow, { medium: true, scale: 0.6 });
  } else if (data.next) {
    text(widget, `ถัดไป · ${data.next.when} ${data.next.time} น.`, 12, soft, { scale: 0.8 });
    widget.addSpacer(2);
    text(widget, data.next.name, 22, snow, { medium: true, scale: 0.6 });
  } else {
    text(widget, "จบทริปแล้ว", 22, snow, { medium: true });
  }
  widget.addSpacer();

  // Its own tap target, so the rest of the widget can still open the site.
  if (data.stay) {
    const button = widget.addStack();
    button.backgroundColor = accent;
    button.cornerRadius = 12;
    button.setPadding(7, 10, 7, 10);
    button.centerAlignContent();
    button.url = data.stay.url;
    const icon = button.addImage(SFSymbol.named("location.fill").image);
    icon.imageSize = new Size(12, 12);
    icon.tintColor = snow;
    button.addSpacer(6);
    text(button, "นำทางไปที่พัก", 13, snow, { medium: true });
    // Cut here rather than left to the layout, which would shorten the label too.
    if (!small) {
      const name = data.stay.name.length > 24 ? `${data.stay.name.slice(0, 23)}…` : data.stay.name;
      button.addSpacer(8);
      text(button, name, 11, new Color("#f7f7ff", 0.8), { scale: 0.8 });
    }
    button.addSpacer();
  }
  return widget;
}

const widget = build(await load());
if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
