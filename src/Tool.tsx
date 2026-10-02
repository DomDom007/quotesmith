// Quotesmith: build a clean itemised quote from your own price book in two minutes, then print or send it.
import { useState } from "react";
import { moneyFmt } from "./lib/money";
import { shareLink, openLater, waLink } from "./lib/share";
import { uid, useStored } from "./lib/store";
import { useShared } from "./lib/useShared";
import { CurrencySelect, Section } from "./ui/kit";

const T = "quotesmith";
type Book = { id: string; name: string; unit: string; price: number; kind: "labour" | "material" };
type Line = { id: string; name: string; unit: string; qty: number; price: number; kind: "labour" | "material" };
type Quote = { id: string; no: string; client: string; phone: string; address: string; job: string; lines: Line[]; date: string; validDays: number; status: "draft" | "sent" | "won" | "lost" };
type Biz = { name: string; phone: string; email: string; taxId: string; currency: string; vat: number; markup: number; terms: string };

const BOOK: Book[] = [
  { id: "b1", name: "Labour", unit: "hour", price: 35, kind: "labour" },
  { id: "b2", name: "Call-out fee", unit: "visit", price: 30, kind: "labour" },
  { id: "b3", name: "Copper pipe 15mm", unit: "metre", price: 9.5, kind: "material" },
  { id: "b4", name: "Mixer tap", unit: "piece", price: 120, kind: "material" },
  { id: "b5", name: "Water heater 80L", unit: "piece", price: 540, kind: "material" },
  { id: "b6", name: "Fittings and sealant", unit: "set", price: 25, kind: "material" },
];
const BIZ: Biz = { name: "Hedi Plomberie", phone: "+216 22 000 000", email: "hedi@example.com", taxId: "MF 1234567/A", currency: "TND", vat: 19, markup: 15, terms: "50% deposit before work starts. Balance on completion. Materials stay our property until paid." };
const blank = (no: string): Quote => ({ id: uid(), no, client: "", phone: "", address: "", job: "", lines: [], date: new Date().toISOString().slice(0, 10), validDays: 30, status: "draft" });

function totals(q: Quote, b: Biz) {
  const line = (l: Line) => l.qty * l.price * (l.kind === "material" ? 1 + b.markup / 100 : 1);
  const sub = q.lines.reduce((a, l) => a + line(l), 0), vat = (sub * b.vat) / 100;
  return { line, sub, vat, total: sub + vat };
}

function QuoteDoc({ q, b }: { q: Quote; b: Biz }) {
  const money = moneyFmt(b.currency), t = totals(q, b);
  const valid = new Date(q.date); valid.setDate(valid.getDate() + q.validDays);
  return (
    <article className="qs-doc">
      <header><div><h3>{b.name}</h3><p>{b.phone} · {b.email}</p><p>{b.taxId}</p></div><div className="qs-meta"><strong>Quote {q.no}</strong><p>{new Date(q.date).toLocaleDateString()}</p><p>Valid until {valid.toLocaleDateString()}</p></div></header>
      <p className="qs-for"><span>For</span> {q.client || "Client"}{q.address && `, ${q.address}`}</p>
      {q.job && <p className="qs-job">{q.job}</p>}
      <table><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead>
        <tbody>{q.lines.map(l => <tr key={l.id}><td>{l.name}</td><td>{l.qty} {l.unit}</td><td>{money(t.line({ ...l, qty: 1 }))}</td><td>{money(t.line(l))}</td></tr>)}</tbody>
        <tfoot><tr><td colSpan={3}>Subtotal</td><td>{money(t.sub)}</td></tr>{b.vat > 0 && <tr><td colSpan={3}>VAT {b.vat}%</td><td>{money(t.vat)}</td></tr>}<tr className="qs-total"><td colSpan={3}>Total</td><td>{money(t.total)}</td></tr></tfoot>
      </table>
      <p className="qs-terms">{b.terms}</p>
    </article>
  );
}

export default function Quotesmith() {
  const shared = useShared<{ q: Quote; b: Biz }>();
  const [book, setBook] = useStored<Book[]>(T, "book", BOOK);
  const [biz, setBiz] = useStored<Biz>(T, "biz", BIZ);
  const [quotes, setQuotes] = useStored<Quote[]>(T, "quotes", []);
  const [next, setNext] = useStored(T, "next", 101);
  const [q, setQ] = useStored<Quote>(T, "draft", { ...blank("Q-100"), client: "Mme Ben Salah", address: "Menzah 6", job: "Replace kitchen tap and water heater", lines: [{ id: "x1", name: "Water heater 80L", unit: "piece", qty: 1, price: 540, kind: "material" }, { id: "x2", name: "Mixer tap", unit: "piece", qty: 1, price: 120, kind: "material" }, { id: "x3", name: "Fittings and sealant", unit: "set", qty: 1, price: 25, kind: "material" }, { id: "x4", name: "Labour", unit: "hour", qty: 4, price: 35, kind: "labour" }] });
  const [tab, setTab] = useState<"quote" | "book" | "list">("quote");
  const css = <style>{`.qs-doc{background:#fff;color:#151933;border-radius:10px;padding:32px;box-shadow:var(--shadow);font-size:15px}.qs-doc header{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;border-bottom:2px solid #151933;padding-bottom:16px}
  .qs-doc h3{font-size:28px}.qs-meta{text-align:right}.qs-for{margin-top:18px}.qs-for span{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#555C78;margin-right:6px}.qs-job{font-family:var(--serif);font-size:20px;margin-top:6px}
  .qs-doc table{width:100%;border-collapse:collapse;margin-top:16px}.qs-doc th{text-align:left;font-family:var(--mono);font-weight:400;font-size:11px;text-transform:uppercase;color:#555C78;border-bottom:1px solid #cdd2de;padding:6px}.qs-doc td{padding:8px 6px;border-bottom:1px solid #eceef3}
  .qs-doc td:not(:first-child),.qs-doc th:not(:first-child){text-align:right}.qs-doc tfoot td{border:0}.qs-total td{font-weight:800;font-size:18px;border-top:2px solid #151933!important}.qs-terms{margin-top:18px;font-size:13px;color:#555C78}
  @media print{body *{visibility:hidden}.qs-doc,.qs-doc *{visibility:visible}.qs-doc{position:absolute;left:0;top:0;width:100%;box-shadow:none}}`}</style>;

  if (shared.loading) return <p className="empty-note">Opening quote…</p>;
  if (shared.data) return <div className="stack">{css}<QuoteDoc q={shared.data.q} b={shared.data.b} /><p className="note">To accept, reply to the message this link came with.</p></div>;

  const t = totals(q, biz), money = moneyFmt(biz.currency);
  const setL = (id: string, p: Partial<Line>) => setQ({ ...q, lines: q.lines.map(l => (l.id === id ? { ...l, ...p } : l)) });
  const save = (status: Quote["status"] = "draft") => { const saved = { ...q, status }; setQuotes([saved, ...quotes.filter(x => x.id !== q.id)]); return saved; };
  const fresh = () => { save(); setQ(blank(`Q-${next}`)); setNext(next + 1); };

  return (
    <div className="stack">{css}
      <div className="row"><div className="seg-mini"><button aria-pressed={tab === "quote"} onClick={() => setTab("quote")}>Quote</button><button aria-pressed={tab === "book"} onClick={() => setTab("book")}>Price book and business</button><button aria-pressed={tab === "list"} onClick={() => setTab("list")}>All quotes ({quotes.length})</button></div></div>

      {tab === "quote" && <div className="grid2">
        <div className="stack">
          <Section title={`Quote ${q.no}`} aside={<button className="btn small" onClick={fresh}>New quote</button>}>
            <div className="stack" style={{ gap: 10 }}>
              <div className="row"><label className="field"><span>Client</span><input id="qs-cl" className="input" value={q.client} onChange={e => setQ({ ...q, client: e.target.value })} /></label><label className="field"><span>WhatsApp</span><input id="qs-ph" className="input" value={q.phone} onChange={e => setQ({ ...q, phone: e.target.value })} /></label></div>
              <label className="field"><span>Address</span><input id="qs-ad" className="input" value={q.address} onChange={e => setQ({ ...q, address: e.target.value })} /></label>
              <label className="field"><span>Job</span><input id="qs-job" className="input" value={q.job} onChange={e => setQ({ ...q, job: e.target.value })} /></label>
            </div>
          </Section>
          <Section title="Add from your price book">
            <div className="row" style={{ gap: 6 }}>{book.map(b => <button key={b.id} className="btn small" onClick={() => setQ({ ...q, lines: [...q.lines, { id: uid(), name: b.name, unit: b.unit, qty: 1, price: b.price, kind: b.kind }] })}>+ {b.name}</button>)}</div>
            <div className="stack" style={{ gap: 8, marginTop: 14 }}>
              {q.lines.map(l => (
                <div key={l.id} className="row" style={{ alignItems: "center" }}>
                  <input className="input" style={{ flex: 3 }} aria-label="Item" value={l.name} onChange={e => setL(l.id, { name: e.target.value })} />
                  <input className="input num" style={{ flex: 1 }} aria-label="Quantity" value={l.qty} onChange={e => setL(l.id, { qty: parseFloat(e.target.value) || 0 })} />
                  <span className="note" style={{ width: 50 }}>{l.unit}</span>
                  <input className="input num" style={{ flex: 1 }} aria-label="Price" value={l.price} onChange={e => setL(l.id, { price: parseFloat(e.target.value) || 0 })} />
                  <button className="btn ghost small danger" onClick={() => setQ({ ...q, lines: q.lines.filter(x => x.id !== l.id) })}>Remove</button>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 12 }}><strong>Total {money(t.total)}</strong> <span className="note">includes {biz.markup}% on materials and {biz.vat}% VAT</span></p>
          </Section>
          <div className="row">
            <button className="btn primary" onClick={() => { const s = save("sent"); openLater(async () => waLink(`Hello ${s.client}, here is your quote ${s.no} from ${biz.name}: ${money(t.total)}.\n${await shareLink(T, { q: s, b: biz }, "m=quote")}`, s.phone)); }}>Send on WhatsApp</button>
            <button className="btn" onClick={() => { save(); window.print(); }}>Print or save as PDF</button>
            <button className="btn ghost" onClick={() => save()}>Save draft</button>
          </div>
        </div>
        <QuoteDoc q={q} b={biz} />
      </div>}

      {tab === "book" && <div className="grid2">
        <Section title="Price book">
          <div className="stack" style={{ gap: 8 }}>
            {book.map(b => (
              <div key={b.id} className="row" style={{ alignItems: "center" }}>
                <input className="input" style={{ flex: 3 }} aria-label="Item" value={b.name} onChange={e => setBook(book.map(x => x.id === b.id ? { ...x, name: e.target.value } : x))} />
                <input className="input" style={{ flex: 1 }} aria-label="Unit" value={b.unit} onChange={e => setBook(book.map(x => x.id === b.id ? { ...x, unit: e.target.value } : x))} />
                <input className="input num" style={{ flex: 1 }} aria-label="Price" value={b.price} onChange={e => setBook(book.map(x => x.id === b.id ? { ...x, price: parseFloat(e.target.value) || 0 } : x))} />
                <select className="input" style={{ flex: 1 }} aria-label="Type" value={b.kind} onChange={e => setBook(book.map(x => x.id === b.id ? { ...x, kind: e.target.value as Book["kind"] } : x))}><option value="labour">Labour</option><option value="material">Material</option></select>
                <button className="btn ghost small danger" onClick={() => setBook(book.filter(x => x.id !== b.id))}>Delete</button>
              </div>
            ))}
            <button className="btn small" style={{ alignSelf: "flex-start" }} onClick={() => setBook([...book, { id: uid(), name: "New item", unit: "piece", price: 0, kind: "material" }])}>Add an item</button>
          </div>
        </Section>
        <Section title="Your business">
          <div className="stack" style={{ gap: 10 }}>
            <label className="field"><span>Business name</span><input id="qs-bn" className="input" value={biz.name} onChange={e => setBiz({ ...biz, name: e.target.value })} /></label>
            <div className="row"><label className="field"><span>Phone</span><input id="qs-bp" className="input" value={biz.phone} onChange={e => setBiz({ ...biz, phone: e.target.value })} /></label><label className="field"><span>Email</span><input id="qs-be" className="input" value={biz.email} onChange={e => setBiz({ ...biz, email: e.target.value })} /></label></div>
            <div className="row"><label className="field"><span>Tax ID</span><input id="qs-tax" className="input" value={biz.taxId} onChange={e => setBiz({ ...biz, taxId: e.target.value })} /></label><CurrencySelect id="qs-cur" value={biz.currency} onChange={c => setBiz({ ...biz, currency: c })} /></div>
            <div className="row"><label className="field"><span>VAT %</span><input id="qs-vat" className="input num" value={biz.vat} onChange={e => setBiz({ ...biz, vat: parseFloat(e.target.value) || 0 })} /></label><label className="field"><span>Markup on materials %</span><input id="qs-mk" className="input num" value={biz.markup} onChange={e => setBiz({ ...biz, markup: parseFloat(e.target.value) || 0 })} /></label></div>
            <label className="field"><span>Terms</span><textarea id="qs-terms" className="input" rows={3} value={biz.terms} onChange={e => setBiz({ ...biz, terms: e.target.value })} /></label>
          </div>
        </Section>
      </div>}

      {tab === "list" && <Section title="All quotes">
        {quotes.length === 0 ? <p className="empty-note">Saved quotes appear here.</p> : (
          <div className="table-wrap"><table className="t"><thead><tr><th>No.</th><th>Client</th><th>Job</th><th className="r">Total</th><th>Status</th><th /></tr></thead>
            <tbody>{quotes.map(x => <tr key={x.id}><td>{x.no}</td><td>{x.client}</td><td>{x.job}</td><td className="r">{money(totals(x, biz).total)}</td>
              <td><select className="input" style={{ fontSize: 13, padding: "4px 6px" }} aria-label="Status" value={x.status} onChange={e => setQuotes(quotes.map(y => y.id === x.id ? { ...y, status: e.target.value as Quote["status"] } : y))}><option value="draft">Draft</option><option value="sent">Sent</option><option value="won">Won</option><option value="lost">Lost</option></select></td>
              <td className="r"><button className="btn ghost small" onClick={() => { setQ(x); setTab("quote"); }}>Open</button><button className="btn ghost small danger" onClick={() => setQuotes(quotes.filter(y => y.id !== x.id))}>Delete</button></td></tr>)}</tbody></table></div>
        )}
        {quotes.length > 0 && <p className="note" style={{ marginTop: 10 }}>Win rate: {Math.round((quotes.filter(x => x.status === "won").length / Math.max(1, quotes.filter(x => x.status === "won" || x.status === "lost").length)) * 100)}% of decided quotes.</p>}
      </Section>}
    </div>
  );
}
