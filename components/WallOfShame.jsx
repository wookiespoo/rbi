"use client";
import { useState, useMemo, useEffect } from "react";

/*
 * WALL OF SHAME — community rug-pull bulletin, "most wanted" styling.
 * Data wiring unchanged: fetches /api/records, posts tips to /api/report.
 * SEED is the offline fallback / first paint.
 * The "mugshot" is a deterministic identicon of the token mint — never a person.
 */
const SEED = [
  {
    id: 1,
    name: "Fraude",
    ticker: "FRAUDE",
    token: "7w5ayJSjtoPmEY2UfiDm9RmJjz2CW7yF8Y6v7HxSpump",
    deployer: "GTkLbxp7h5FDEgRufgpDnjm96Gzs2sLaw4tDCH2Zpwj1",
    status: "confirmed",
    source: "manual",
    reason:
      "Claimed legit on stream and hyped paid bounties plus a DEX boost — delivered neither. Claimed creator fees, moved the SOL to cash-out wallets, dumped, and ended the stream.",
    solStolen: 56.24,
    tags: ["Wash-traded own token to fake volume", "Fake bounties — never paid out", "Swore he was honest on stream — then dumped"],
    projectX: "fraude_ai",
    date: "2026-06-14",
  },
  {
    id: 2,
    name: "Trumps Birthday",
    ticker: "TRUMPDAY",
    token: "9LJ9…pump", // TODO: full mint (copy from the token page)
    deployer: "FVfUb…RZdV", // TODO: full wallet — "miraclemilly" (copy from Solscan)
    status: "confirmed",
    source: "manual",
    reason:
      "Serial launcher 'miraclemilly': one wallet spun up 3 tokens in 23 hours — MiracleMilly, White Whale, and TRUMPDAY — each collapsed to ~$1–2K within hours. Promised a 40x DEX boost at 15K on stream; it never held. ATH $55.2K → $1.63K.",
    solStolen: null,
    tags: ["Serial launcher — 3 dead tokens in 23h", "Promised DEX boost — never held", "Pumped to $55K ATH, dumped to $1.6K"],
    projectX: "TNSDEVO",
    date: "2026-06-14",
  },
];

const P = {
  paper: "#E7DEC9",
  paper2: "#EFE8D6",
  ink: "#1B1712",
  ink2: "#473F31",
  faint: "#7C7159",
  red: "#A8261E",
  redDeep: "#7C1A15",
  navy: "#21314F",
  rule: "#2A2419",
  ochre: "#8C600F",
};

const STAMP = {
  confirmed: { label: "Confirmed Rug", color: P.red },
  flagged: { label: "Flagged · Unverified", color: P.ochre },
  pending: { label: "Tip Pending", color: P.navy },
};

const SOURCE = { screen: "On-chain screen", manual: "Bureau filing", community: "Community tip" };

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < (s || "x").length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function trunc(s, head = 6, tail = 6) {
  if (!s) return "—";
  return s.length <= head + tail + 1 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function Identicon({ seed, size = 132 }) {
  const h = hashStr(seed);
  const cells = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 3; c++) {
      if (((h >> (r * 3 + c)) & 1) === 1) {
        cells.push([c, r]);
        if (c !== 2) cells.push([4 - c, r]);
      }
    }
  }
  const u = size / 5;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <rect width={size} height={size} fill={P.paper} />
      {cells.map(([c, r], i) => (
        <rect key={i} x={c * u} y={r * u} width={u} height={u} fill={P.ink} />
      ))}
    </svg>
  );
}

function Seal({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="47" fill="none" stroke={P.ink} strokeWidth="2.5" />
      <circle cx="50" cy="50" r="40" fill="none" stroke={P.ink} strokeWidth="1" />
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <circle key={i} cx={50 + Math.cos(a) * 43.5} cy={50 + Math.sin(a) * 43.5} r="1.1" fill={P.ink} />;
      })}
      <path d="M35 28 L50 46 L65 28" fill="none" stroke={P.red} strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M58 28 L65 28 L65 35" fill="none" stroke={P.red} strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" />
      <text x="50" y="72" textAnchor="middle" fontFamily="'Anton', sans-serif" fontSize="25" letterSpacing="1.5" fill={P.ink}>RBI</text>
    </svg>
  );
}

function Stamp({ status }) {
  const s = STAMP[status];
  if (!s) return null;
  return (
    <div className="wb-stamp" style={{ color: s.color, borderColor: s.color }}>
      {s.label}
    </div>
  );
}

function PosterCard({ rec, featured }) {
  return (
    <div className={`wb-poster ${featured ? "wb-poster--big" : ""}`}>
      <Stamp status={rec.status} />
      <div className="wb-poster-head">Wanted</div>
      <div className="wb-poster-sub">for crowd-funded rug pull · pump.fun</div>

      <div className="wb-poster-body">
        <div className="wb-mug">
          <Identicon seed={rec.token} size={featured ? 150 : 120} />
          <div className="wb-mug-cap">{rec.ticker ? `$${rec.ticker}` : "TOKEN"}</div>
        </div>

        <div className="wb-poster-info">
          <div className="wb-name">{rec.name || "Unnamed token"}</div>
          <div className="wb-field"><span>SUBJECT WALLET</span>{trunc(rec.deployer)}</div>
          <div className="wb-field"><span>TOKEN MINT</span>{trunc(rec.token)}</div>
          {rec.projectX && (
            <div className="wb-field">
              <span>KNOWN CHANNEL</span>
              <a href={`https://x.com/${rec.projectX}`} target="_blank" rel="noreferrer" style={{ color: P.navy }}>@{rec.projectX}</a>
            </div>
          )}

          {rec.tags?.length > 0 && (
            <div className="wb-wantedfor">
              <div className="wb-wantedfor-h">— WANTED FOR —</div>
              {rec.tags.map((t) => <div key={t} className="wb-charge">› {t}</div>)}
            </div>
          )}
        </div>
      </div>

      {rec.solStolen != null && (
        <div className="wb-reward">
          <span>FUNDS EXTRACTED</span>
          <strong>{rec.solStolen} SOL</strong>
        </div>
      )}

      {rec.reason && (
        <div className="wb-caution-box">
          <b>CAUTION:</b> {rec.reason}
        </div>
      )}

      {rec.imageUrl && (
        <div className="wb-exhibit">
          <div className="wb-exhibit-h">— Exhibit · pump.fun —</div>
          <img src={rec.imageUrl} alt={`${rec.ticker || "token"} pump.fun screenshot`} loading="lazy" />
        </div>
      )}

      <div className="wb-poster-foot">
        CASE NO. {String(rec.id).padStart(4, "0")} · FILED {rec.date} · {SOURCE[rec.source] || "—"}
      </div>
    </div>
  );
}

export default function WallOfShame() {
  const [records, setRecords] = useState(SEED);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ token: "", reason: "", sol: "", alias: "", image: "", imgName: "", submitter: "", deployer: "" });
  const [flash, setFlash] = useState("");

  useEffect(() => {
    fetch("/api/records")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length) setRecords(data); })
      .catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const confirmed = records.filter((r) => r.status === "confirmed").length;
    const sol = records.reduce((a, r) => a + (Number(r.solStolen) || 0), 0);
    return { total: records.length, confirmed, sol };
  }, [records]);

  const featured = useMemo(() => records.filter((r) => r.status === "confirmed").sort((a, b) => b.id - a.id)[0], [records]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return records
      .filter((r) => r.id !== featured?.id)
      .filter((r) => (filter === "all" ? true : r.status === filter))
      .filter((r) =>
        !needle ? true : [r.name, r.ticker, r.token, r.deployer, r.reason].join(" ").toLowerCase().includes(needle)
      )
      .sort((a, b) => b.id - a.id);
  }, [records, q, filter, featured]);

  const onPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setFlash("Only image screenshots can be attached."); return; }
    if (file.size > 4 * 1024 * 1024) { setFlash("Screenshot too large — keep it under 4MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: String(reader.result), imgName: file.name }));
    reader.readAsDataURL(file);
  };

  const handleReport = async () => {
    if (!form.deployer.trim() || !form.token.trim() || !form.reason.trim()) {
      setFlash("Dev wallet, token mint, and a statement of facts are all required.");
      return;
    }
    setFlash(form.image ? "Checking the chain and screening the screenshot…" : "Checking it against the chain…");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deployer: form.deployer.trim(),
          token: form.token.trim(),
          name: form.alias.trim(),
          reason: form.reason.trim(),
          sol: form.sol,
          submitterWallet: form.submitter.trim(),
          image: form.image || undefined,
        }),
      });
      const data = await res.json();
      setForm({ token: "", reason: "", sol: "", alias: "", image: "", imgName: "", submitter: "", deployer: "" });
      setFlash(data.message || (data.accepted ? "Tip filed for review." : "Not filed."));
    } catch {
      setFlash("Filing failed — try again.");
    }
    setTimeout(() => setFlash(""), 6000);
  };

  return (
    <div className="wb-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@500;600;700&family=Special+Elite&display=swap');
        .wb-root{background:#cfc6ae;padding:22px 14px 60px;font-family:'Special Elite',ui-monospace,monospace;color:${P.ink};}
        .wb-sheet{max-width:1000px;margin:0 auto;background:${P.paper};border:3px double ${P.rule};box-shadow:0 10px 30px rgba(0,0,0,.28);padding:26px 26px 34px;}
        .wb-mast{display:flex;align-items:center;gap:18px;border-bottom:3px double ${P.rule};padding-bottom:16px;}
        .wb-mast-mid{flex:1;text-align:center;}
        .wb-eyebrow{font-family:'Oswald',sans-serif;font-weight:600;letter-spacing:.34em;font-size:11px;color:${P.ink2};text-transform:uppercase;}
        .wb-title{font-family:'Anton',sans-serif;font-size:clamp(40px,9vw,82px);line-height:.86;letter-spacing:.01em;color:${P.ink};margin:4px 0 2px;}
        .wb-title b{color:${P.red};}
        .wb-mast-meta{font-size:11px;letter-spacing:.12em;color:${P.faint};text-transform:uppercase;}
        .wb-caution{margin:14px 0;background:repeating-linear-gradient(45deg,${P.ink} 0 14px,${P.ochre} 14px 28px);padding:3px;}
        .wb-caution span{display:block;background:${P.paper};text-align:center;font-family:'Oswald',sans-serif;font-weight:700;letter-spacing:.18em;font-size:12px;padding:7px;text-transform:uppercase;color:${P.ink};}
        .wb-stats{display:flex;flex-wrap:wrap;gap:0;border:2px solid ${P.rule};margin-bottom:18px;}
        .wb-stat{flex:1;min-width:120px;padding:11px 16px;border-right:1px solid ${P.rule};}
        .wb-stat:last-child{border-right:none;}
        .wb-stat b{font-family:'Anton',sans-serif;font-size:26px;color:${P.ink};display:block;}
        .wb-stat span{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${P.faint};}
        .wb-controls{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px;align-items:center;}
        .wb-search{flex:1;min-width:200px;background:${P.paper2};border:2px solid ${P.rule};padding:9px 12px;font-family:'Special Elite',monospace;font-size:13px;color:${P.ink};}
        .wb-tab{font-family:'Oswald',sans-serif;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;padding:8px 13px;border:2px solid ${P.rule};background:${P.paper2};color:${P.ink2};cursor:pointer;}
        .wb-tab--on{background:${P.ink};color:${P.paper};}
        .wb-label{font-family:'Oswald',sans-serif;font-weight:700;letter-spacing:.2em;font-size:12px;text-transform:uppercase;color:${P.ink2};margin:6px 0 10px;}
        .wb-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
        @media(max-width:680px){.wb-grid{grid-template-columns:1fr;}.wb-mast{flex-direction:column;}}
        .wb-poster{position:relative;background:${P.paper2};border:2px solid ${P.rule};outline:5px solid ${P.paper2};outline-offset:-9px;padding:18px 18px 14px;overflow:hidden;}
        .wb-poster--big{grid-column:1 / -1;}
        .wb-poster-head{font-family:'Oswald',sans-serif;font-weight:700;font-size:30px;letter-spacing:.16em;text-transform:uppercase;text-align:center;color:${P.ink};}
        .wb-poster--big .wb-poster-head{font-size:44px;}
        .wb-poster-sub{text-align:center;font-size:11px;letter-spacing:.1em;color:${P.faint};text-transform:uppercase;border-bottom:2px solid ${P.rule};padding-bottom:10px;margin-bottom:14px;}
        .wb-poster-body{display:flex;gap:16px;}
        @media(max-width:520px){.wb-poster-body{flex-direction:column;align-items:center;text-align:center;}}
        .wb-mug{flex-shrink:0;border:2px solid ${P.rule};padding:5px;background:${P.paper};}
        .wb-mug-cap{font-family:'Oswald',sans-serif;font-weight:700;text-align:center;letter-spacing:.06em;font-size:14px;padding-top:4px;color:${P.ink};}
        .wb-poster-info{flex:1;min-width:0;}
        .wb-name{font-family:'Oswald',sans-serif;font-weight:700;font-size:23px;text-transform:uppercase;letter-spacing:.02em;color:${P.ink};margin-bottom:8px;}
        .wb-field{font-size:12px;color:${P.ink2};margin-bottom:5px;word-break:break-all;}
        .wb-field span{display:inline-block;min-width:120px;color:${P.faint};letter-spacing:.08em;font-size:10px;}
        .wb-wantedfor{margin-top:12px;border-top:1px dashed ${P.rule};padding-top:10px;}
        .wb-wantedfor-h{text-align:center;font-family:'Oswald',sans-serif;font-weight:700;letter-spacing:.2em;font-size:11px;color:${P.red};margin-bottom:7px;}
        .wb-charge{font-size:12.5px;color:${P.ink};margin-bottom:4px;}
        .wb-reward{display:flex;align-items:center;justify-content:space-between;border:2px solid ${P.red};margin-top:14px;padding:8px 14px;}
        .wb-reward span{font-family:'Oswald',sans-serif;font-weight:600;letter-spacing:.16em;font-size:12px;text-transform:uppercase;color:${P.redDeep};}
        .wb-reward strong{font-family:'Anton',sans-serif;font-size:24px;color:${P.red};}
        .wb-caution-box{margin-top:12px;font-size:12.5px;line-height:1.5;color:${P.ink2};border-left:3px solid ${P.ochre};padding-left:10px;}
        .wb-caution-box b{color:${P.ink};letter-spacing:.06em;}
        .wb-poster-foot{margin-top:14px;border-top:2px solid ${P.rule};padding-top:9px;font-size:10.5px;letter-spacing:.1em;color:${P.faint};text-transform:uppercase;}
        .wb-stamp{position:absolute;top:54px;right:-6px;transform:rotate(11deg);border:3px solid;border-radius:5px;padding:5px 14px;font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.12em;font-size:14px;opacity:.78;background:rgba(231,222,201,.35);}
        .wb-tip{margin-top:26px;border:3px double ${P.rule};padding:20px;background:${P.paper2};}
        .wb-tip h2{font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.14em;font-size:18px;margin:0 0 4px;}
        .wb-tip p{font-size:12px;color:${P.ink2};line-height:1.5;margin:0 0 14px;}
        .wb-in{width:100%;background:${P.paper};border:2px solid ${P.rule};padding:10px 12px;font-family:'Special Elite',monospace;font-size:13px;color:${P.ink};margin-bottom:10px;}
        .wb-row{display:flex;gap:10px;flex-wrap:wrap;}
        .wb-row .wb-in{flex:1;min-width:140px;}
        .wb-submit{background:${P.ink};color:${P.paper};font-family:'Oswald',sans-serif;font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:14px;border:none;padding:11px 24px;cursor:pointer;}
        .wb-foot-note{text-align:center;font-size:10.5px;letter-spacing:.08em;color:${P.faint};margin-top:22px;text-transform:uppercase;}
        .wb-root ::placeholder{color:${P.faint};}
        .wb-root input:focus,.wb-root textarea:focus{outline:2px solid ${P.navy};outline-offset:1px;}
        .wb-exhibit{margin-top:14px;border-top:1px dashed ${P.rule};padding-top:10px;}
        .wb-exhibit-h{font-family:'Oswald',sans-serif;font-weight:700;letter-spacing:.2em;font-size:10px;color:${P.faint};text-align:center;margin-bottom:8px;text-transform:uppercase;}
        .wb-exhibit img{display:block;width:100%;border:2px solid ${P.rule};background:#0d0d0d;}
        .wb-upload{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;}
        .wb-upbtn{display:inline-block;background:${P.paper};border:2px dashed ${P.rule};padding:9px 14px;font-family:'Oswald',sans-serif;font-weight:600;text-transform:uppercase;letter-spacing:.08em;font-size:12px;color:${P.ink2};cursor:pointer;}
        .wb-upmeta{display:inline-flex;align-items:center;gap:8px;font-size:11px;color:${P.ink2};min-width:0;}
        .wb-upname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px;}
        .wb-upthumb{width:34px;height:34px;object-fit:cover;border:1px solid ${P.rule};flex-shrink:0;}
        .wb-uprm{background:none;border:none;color:${P.red};font-family:inherit;font-size:11px;cursor:pointer;text-decoration:underline;padding:0;}
        @media(prefers-reduced-motion:reduce){*{transition:none!important;}}
      `}</style>

      <div className="wb-sheet">
        <header className="wb-mast">
          <Seal />
          <div className="wb-mast-mid">
            <div className="wb-eyebrow">Rug Bureau of Investigation</div>
            <div className="wb-title">MOST <b>WANTED</b></div>
            <div className="wb-mast-meta">pump.fun deployers · R.B.I. Field Bulletin No. {String(stats.total).padStart(3, "0")} · Issued {new Date().toISOString().slice(0, 10)}</div>
          </div>
          <Seal />
        </header>

        <div className="wb-caution"><span>Caution — known rug operators — verify on-chain before trading</span></div>

        <div className="wb-stats">
          <div className="wb-stat"><b>{stats.total}</b><span>cases filed</span></div>
          <div className="wb-stat"><b>{stats.confirmed}</b><span>confirmed rugs</span></div>
          <div className="wb-stat"><b>{stats.sol ? stats.sol : "—"}</b><span>SOL extracted</span></div>
        </div>

        <div className="wb-controls">
          <input className="wb-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search token, ticker, or wallet…" />
          {["all", "confirmed", "flagged", "pending"].map((f) => (
            <button key={f} className={`wb-tab ${filter === f ? "wb-tab--on" : ""}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        {featured && (
          <>
            <div className="wb-label">▸ Top of the bulletin</div>
            <PosterCard rec={featured} featured />
            <div style={{ height: 22 }} />
          </>
        )}

        {shown.length === 0 ? (
          <div style={{ textAlign: "center", color: P.faint, padding: "30px 0", fontSize: 13 }}>
            No subjects match. Adjust your search or filters above.
          </div>
        ) : (
          <div className="wb-grid">
            {shown.map((r) => <PosterCard key={r.id} rec={r} />)}
          </div>
        )}

        <div className="wb-tip">
          <h2>Submit a tip</h2>
          <p>Give the dev wallet, the token mint, and a statement of facts, plus an optional pump.fun / chart screenshot as proof. Submissions are checked against the chain, the screenshot is screened, and everything is held for review — nothing posts to the board until approved.</p>
          <div className="wb-row">
            <input className="wb-in" value={form.deployer} onChange={(e) => setForm({ ...form, deployer: e.target.value })} placeholder="Dev wallet *" />
            <input className="wb-in" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} placeholder="Token mint *" />
            <input className="wb-in" style={{ flex: "0 0 110px", minWidth: 0 }} value={form.sol} onChange={(e) => setForm({ ...form, sol: e.target.value.replace(/[^0-9.]/g, "") })} placeholder="SOL taken" />
          </div>
          <textarea className="wb-in" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Statement of facts — on-chain / public evidence only *" />
          <div className="wb-row">
            <input className="wb-in" value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} placeholder="Token name (optional)" />
            <input className="wb-in" value={form.submitter} onChange={(e) => setForm({ ...form, submitter: e.target.value })} placeholder="Your SOL payout wallet — for bounty payouts (optional)" />
          </div>
          <div className="wb-upload">
            <label className="wb-upbtn">
              {form.imgName ? "Change screenshot" : "Attach proof screenshot"}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onPick} style={{ display: "none" }} />
            </label>
            {form.image && (
              <span className="wb-upmeta">
                <img src={form.image} alt="" className="wb-upthumb" />
                <span className="wb-upname">{form.imgName}</span>
                <button type="button" className="wb-uprm" onClick={() => setForm({ ...form, image: "", imgName: "" })}>remove</button>
              </span>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: flash.includes("required") ? P.red : P.navy, minHeight: 16 }}>{flash}</span>
            <button className="wb-submit" onClick={handleReport}>File tip</button>
          </div>
        </div>

        <div className="wb-foot-note">Rug Bureau of Investigation · on-chain facts only · a wallet here is public record, not a claim about anyone's identity</div>
      </div>
    </div>
  );
}
