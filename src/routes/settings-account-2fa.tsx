import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";
import { SettingsBack, SettingsNav, ToggleRow } from "@/components/settings-nav";

// Simulated Base32 secret — in production this comes from the backend
const TOTP_SECRET = "JBSWY3DPEHPK3PXP";
const ISSUER = "Fanation";
const USER_EMAIL = "user@fanation.app";

const BACKUP_CODES = [
  "A1B2-C3D4", "E5F6-G7H8", "I9J0-K1L2",
  "M3N4-O5P6", "Q7R8-S9T0", "U1V2-W3X4",
  "Y5Z6-A7B8", "C9D0-E1F2",
];

type Step = "idle" | "setup" | "done";

export default function SettingsTwoFactorPage() {
  const navigate = useNavigate();
  const S = useAppStore();
  const [step, setStep] = useState<Step>("idle");
  const [otherMethods, setOtherMethods] = useState({ SMS: false, Email: false, "Face ID": false });
  const [qrUrl, setQrUrl] = useState("");
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState(false);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const otpUri = `otpauth://totp/${encodeURIComponent(ISSUER)}:${encodeURIComponent(USER_EMAIL)}?secret=${TOTP_SECRET}&issuer=${encodeURIComponent(ISSUER)}&algorithm=SHA1&digits=6&period=30`;

  useEffect(() => {
    if (step === "setup") {
      QRCode.toDataURL(otpUri, { width: 200, margin: 2, color: { dark: "#000000", light: "#ffffff" } })
        .then(setQrUrl)
        .catch(() => setQrUrl(""));
      setTimeout(() => codeRef.current?.focus(), 100);
    }
  }, [step, otpUri]);

  const toggleOther = (k: keyof typeof otherMethods) => {
    if (k === "SMS") S.toast("SMS 2FA requires a verified phone number — add one in Account settings.", "ok");
    else if (k === "Email") S.toast("A one-time code will be sent to your email on each sign-in.", "ok");
    else if (k === "Face ID") S.toast("Face ID 2FA is available on a verified mobile device.", "ok");
    setOtherMethods((o) => ({ ...o, [k]: !o[k] }));
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(TOTP_SECRET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      S.toast("Couldn't copy — select the key manually", "err");
    }
  };

  const verify = () => {
    if (code.length < 6) return;
    // Frontend simulation — in production validate against the backend TOTP
    setCodeErr(false);
    setStep("done");
  };

  const downloadCodes = () => {
    const text = `Fanation — Two-Factor Authentication Backup Codes\n\nKeep these codes in a safe place. Each can be used once.\n\n${BACKUP_CODES.join("\n")}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = "fanation-backup-codes.txt";
    a.click();
  };

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <div className="col gap16" style={{ maxWidth: 520, width: "100%" }}>
          <SettingsBack />

          {/* ── Methods card ── */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {(["SMS", "Email", "Face ID"] as const).map((k) => (
              <div key={k}>
                <ToggleRow label={k} sub={
                  k === "SMS" ? "A one-time code will be sent to your phone"
                  : k === "Email" ? "A one-time code will be sent to your email"
                  : "Works only on your mobile phone"
                } on={otherMethods[k]} onChange={() => toggleOther(k)} />
                <hr className="divider" />
              </div>
            ))}
            <ToggleRow
              label="Authenticator App"
              sub="Connect your account with your 2FA app"
              on={step !== "idle"}
              onChange={() => {
                if (step !== "idle") { setStep("idle"); setCode(""); setCodeErr(false); }
                else setStep("setup");
              }}
            />
          </div>

          {/* ── Setup flow ── */}
          {step === "setup" && (
            <>
              <div className="card" style={{ padding: 20, textAlign: "center" }}>
                <div className="b7 t15" style={{ marginBottom: 4 }}>Scan with your authenticator app</div>
                <p className="muted t12" style={{ marginBottom: 16 }}>
                  Use Google Authenticator, Authy, 1Password, or any TOTP app.
                </p>

                {qrUrl ? (
                  <div style={{
                    display: "inline-flex", padding: 12, background: "#fff",
                    borderRadius: 12, marginBottom: 16,
                  }}>
                    <img src={qrUrl} alt="Authenticator QR code" width={180} height={180} />
                  </div>
                ) : (
                  <div style={{
                    width: 204, height: 204, margin: "0 auto 16px",
                    background: "var(--card2)", borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span className="muted t12">Loading…</span>
                  </div>
                )}

                <p className="muted t12" style={{ marginBottom: 10 }}>Can't scan? Enter this key manually:</p>
                <div className="row gap8" style={{ justifyContent: "center", flexWrap: "wrap" }}>
                  <code style={{
                    fontFamily: "monospace", fontSize: 15, letterSpacing: 2,
                    padding: "6px 12px", background: "var(--card2)", borderRadius: 8,
                  }}>
                    {TOTP_SECRET}
                  </code>
                  <button className="btn btn-ghost btn-sm" onClick={copySecret} style={{ gap: 6 }}>
                    <Icon n={copied ? "check" : "doc"} s={14} />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="card" style={{ padding: 16 }}>
                <div className="b7 t14" style={{ marginBottom: 8 }}>Setup steps</div>
                <ol className="muted t13" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
                  <li>Open your authenticator app and tap <strong>+</strong> or <strong>Add Account</strong>.</li>
                  <li>Choose <strong>Scan QR code</strong> and point your camera at the code above.</li>
                  <li>Or choose <strong>Enter key manually</strong> and type the key shown.</li>
                  <li>Your app will show a 6-digit code — enter it below to verify.</li>
                </ol>
              </div>

              <div className="col gap6">
                <label className="up muted t11">6-digit verification code</label>
                <input
                  ref={codeRef}
                  className={"input" + (codeErr ? " err" : "")}
                  placeholder="000000"
                  value={code}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  style={{ letterSpacing: 4, fontSize: 22, textAlign: "center" }}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, ""));
                    setCodeErr(false);
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") verify(); }}
                />
                {codeErr && <span className="coral t12">Incorrect code — check your app and try again.</span>}
              </div>

              <button
                className="btn btn-blue"
                disabled={code.length < 6}
                onClick={verify}
              >
                Verify &amp; Enable
              </button>
            </>
          )}

          {/* ── Done / success ── */}
          {step === "done" && (
            <>
              <div className="card" style={{ padding: 24, textAlign: "center" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(93,221,144,.15)", margin: "0 auto 12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon n="check" s={24} c="var(--mint-ink)" />
                </div>
                <div className="b7 t16" style={{ marginBottom: 4 }}>Authenticator app enabled</div>
                <p className="muted t13">
                  You'll be asked for a code from your app whenever you sign in.
                </p>
              </div>

              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px" }}>
                  <div className="b7 t14" style={{ marginBottom: 4 }}>Backup codes</div>
                  <p className="muted t12" style={{ marginBottom: 14 }}>
                    Save these — each can be used once if you lose access to your authenticator app.
                  </p>
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: "8px 24px", marginBottom: 16,
                  }}>
                    {BACKUP_CODES.map((c) => (
                      <code key={c} style={{
                        fontFamily: "monospace", fontSize: 14, letterSpacing: 1,
                        padding: "4px 0", color: "var(--text)",
                      }}>
                        {c}
                      </code>
                    ))}
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={downloadCodes}>
                    <Icon n="doc" s={14} />
                    Download backup codes
                  </button>
                </div>
              </div>

              <button className="btn btn-blue" onClick={() => navigate("/settings")}>
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
