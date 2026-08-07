"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cx } from "@/lib/utils";

// Country dial codes (ISO-3166 alpha-2 + international dial code). Ordered so
// the most likely picks surface first; the rest are alphabetical.
const COUNTRIES: { iso: string; name: string; dial: string }[] = [
  { iso: "IN", name: "India", dial: "91" },
  { iso: "US", name: "United States", dial: "1" },
  { iso: "GB", name: "United Kingdom", dial: "44" },
  { iso: "CA", name: "Canada", dial: "1" },
  { iso: "AU", name: "Australia", dial: "61" },
  { iso: "AE", name: "United Arab Emirates", dial: "971" },
  { iso: "SG", name: "Singapore", dial: "65" },
  { iso: "AF", name: "Afghanistan", dial: "93" },
  { iso: "AL", name: "Albania", dial: "355" },
  { iso: "DZ", name: "Algeria", dial: "213" },
  { iso: "AR", name: "Argentina", dial: "54" },
  { iso: "AM", name: "Armenia", dial: "374" },
  { iso: "AT", name: "Austria", dial: "43" },
  { iso: "AZ", name: "Azerbaijan", dial: "994" },
  { iso: "BH", name: "Bahrain", dial: "973" },
  { iso: "BD", name: "Bangladesh", dial: "880" },
  { iso: "BY", name: "Belarus", dial: "375" },
  { iso: "BE", name: "Belgium", dial: "32" },
  { iso: "BT", name: "Bhutan", dial: "975" },
  { iso: "BO", name: "Bolivia", dial: "591" },
  { iso: "BR", name: "Brazil", dial: "55" },
  { iso: "BG", name: "Bulgaria", dial: "359" },
  { iso: "KH", name: "Cambodia", dial: "855" },
  { iso: "CM", name: "Cameroon", dial: "237" },
  { iso: "CL", name: "Chile", dial: "56" },
  { iso: "CN", name: "China", dial: "86" },
  { iso: "CO", name: "Colombia", dial: "57" },
  { iso: "CR", name: "Costa Rica", dial: "506" },
  { iso: "HR", name: "Croatia", dial: "385" },
  { iso: "CY", name: "Cyprus", dial: "357" },
  { iso: "CZ", name: "Czechia", dial: "420" },
  { iso: "DK", name: "Denmark", dial: "45" },
  { iso: "EG", name: "Egypt", dial: "20" },
  { iso: "EE", name: "Estonia", dial: "372" },
  { iso: "ET", name: "Ethiopia", dial: "251" },
  { iso: "FI", name: "Finland", dial: "358" },
  { iso: "FR", name: "France", dial: "33" },
  { iso: "GE", name: "Georgia", dial: "995" },
  { iso: "DE", name: "Germany", dial: "49" },
  { iso: "GH", name: "Ghana", dial: "233" },
  { iso: "GR", name: "Greece", dial: "30" },
  { iso: "HK", name: "Hong Kong", dial: "852" },
  { iso: "HU", name: "Hungary", dial: "36" },
  { iso: "IS", name: "Iceland", dial: "354" },
  { iso: "ID", name: "Indonesia", dial: "62" },
  { iso: "IR", name: "Iran", dial: "98" },
  { iso: "IQ", name: "Iraq", dial: "964" },
  { iso: "IE", name: "Ireland", dial: "353" },
  { iso: "IL", name: "Israel", dial: "972" },
  { iso: "IT", name: "Italy", dial: "39" },
  { iso: "JP", name: "Japan", dial: "81" },
  { iso: "JO", name: "Jordan", dial: "962" },
  { iso: "KZ", name: "Kazakhstan", dial: "7" },
  { iso: "KE", name: "Kenya", dial: "254" },
  { iso: "KW", name: "Kuwait", dial: "965" },
  { iso: "LV", name: "Latvia", dial: "371" },
  { iso: "LB", name: "Lebanon", dial: "961" },
  { iso: "LT", name: "Lithuania", dial: "370" },
  { iso: "LU", name: "Luxembourg", dial: "352" },
  { iso: "MY", name: "Malaysia", dial: "60" },
  { iso: "MV", name: "Maldives", dial: "960" },
  { iso: "MT", name: "Malta", dial: "356" },
  { iso: "MX", name: "Mexico", dial: "52" },
  { iso: "MA", name: "Morocco", dial: "212" },
  { iso: "MM", name: "Myanmar", dial: "95" },
  { iso: "NP", name: "Nepal", dial: "977" },
  { iso: "NL", name: "Netherlands", dial: "31" },
  { iso: "NZ", name: "New Zealand", dial: "64" },
  { iso: "NG", name: "Nigeria", dial: "234" },
  { iso: "NO", name: "Norway", dial: "47" },
  { iso: "OM", name: "Oman", dial: "968" },
  { iso: "PK", name: "Pakistan", dial: "92" },
  { iso: "PS", name: "Palestine", dial: "970" },
  { iso: "PA", name: "Panama", dial: "507" },
  { iso: "PE", name: "Peru", dial: "51" },
  { iso: "PH", name: "Philippines", dial: "63" },
  { iso: "PL", name: "Poland", dial: "48" },
  { iso: "PT", name: "Portugal", dial: "351" },
  { iso: "QA", name: "Qatar", dial: "974" },
  { iso: "RO", name: "Romania", dial: "40" },
  { iso: "RU", name: "Russia", dial: "7" },
  { iso: "SA", name: "Saudi Arabia", dial: "966" },
  { iso: "RS", name: "Serbia", dial: "381" },
  { iso: "ZA", name: "South Africa", dial: "27" },
  { iso: "KR", name: "South Korea", dial: "82" },
  { iso: "ES", name: "Spain", dial: "34" },
  { iso: "LK", name: "Sri Lanka", dial: "94" },
  { iso: "SE", name: "Sweden", dial: "46" },
  { iso: "CH", name: "Switzerland", dial: "41" },
  { iso: "TW", name: "Taiwan", dial: "886" },
  { iso: "TZ", name: "Tanzania", dial: "255" },
  { iso: "TH", name: "Thailand", dial: "66" },
  { iso: "TR", name: "Turkey", dial: "90" },
  { iso: "UG", name: "Uganda", dial: "256" },
  { iso: "UA", name: "Ukraine", dial: "380" },
  { iso: "UY", name: "Uruguay", dial: "598" },
  { iso: "UZ", name: "Uzbekistan", dial: "998" },
  { iso: "VN", name: "Vietnam", dial: "84" },
  { iso: "YE", name: "Yemen", dial: "967" },
  { iso: "ZW", name: "Zimbabwe", dial: "263" },
];

function flag(iso: string): string {
  return String.fromCodePoint(
    ...iso
      .toUpperCase()
      .split("")
      .map((c) => 127397 + c.charCodeAt(0))
  );
}

// Google-style international phone field: a searchable country-code dropdown
// (flag + dial code) beside a national-number input. Emits an E.164-ish value
// like "+91 9876543210" via onChange.
export function PhoneInput({
  value,
  onChange,
  className,
  inputClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  inputClassName?: string;
}) {
  const [iso, setIso] = useState("IN");
  const [national, setNational] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const country = COUNTRIES.find((c) => c.iso === iso) ?? COUNTRIES[0];

  // Keep the parent's combined value in sync.
  useEffect(() => {
    const digits = national.replace(/[^0-9]/g, "");
    onChange(digits ? `+${country.dial} ${digits}` : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso, national]);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q.replace(/^\+/, "")) ||
        c.iso.toLowerCase() === q
    );
  }, [query]);

  // value is intentionally uncontrolled after mount; guard unused-var lint.
  void value;

  return (
    <div ref={wrapRef} className={cx("relative", className)}>
      <div className="flex">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex h-11 items-center gap-1.5 rounded-l-md border border-r-0 border-line bg-subtle/60 px-3 text-sm outline-none transition hover:bg-subtle focus:border-foreground"
          aria-label="Select country code"
        >
          <span className="text-base leading-none">{flag(country.iso)}</span>
          <span className="text-muted">+{country.dial}</span>
          <ChevronDown size={14} className="text-muted" />
        </button>
        <input
          type="tel"
          inputMode="tel"
          placeholder="Phone number"
          required
          value={national}
          onChange={(e) => setNational(e.target.value.replace(/[^0-9\s]/g, ""))}
          className={cx(
            "h-11 w-full rounded-r-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground",
            inputClassName
          )}
        />
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-72 max-w-[calc(100vw-3rem)] overflow-hidden rounded-md border border-line bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            <Search size={14} className="text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.map((c) => (
              <li key={c.iso}>
                <button
                  type="button"
                  onClick={() => {
                    setIso(c.iso);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cx(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-subtle",
                    c.iso === iso && "bg-subtle"
                  )}
                >
                  <span className="text-base leading-none">{flag(c.iso)}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-muted">+{c.dial}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-muted">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
