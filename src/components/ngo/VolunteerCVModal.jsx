import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, MapPin, Phone, Mail, Calendar, Globe, Clock, Car, Star, AlertCircle, BadgeCheck } from "lucide-react";

function calcAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const dob = new Date(birthDate);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age > 0 ? age : null;
}

export default function VolunteerCVModal({ userEmail, volunteerName, onClose }) {
  const [cv, setCV] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ImpactProfile.filter({ created_by: userEmail }).then(list => {
      setCV(list[0] || null);
      setLoading(false);
    });
  }, [userEmail]);

  const age = calcAge(cv?.cv_birth_date);
  const allSkills = [...(cv?.cv_primary_skills || []), ...(cv?.cv_other_skills || [])];
  if (cv?.cv_custom_skill) allSkills.push(cv.cv_custom_skill);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-foreground text-base">Volunteer CV</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !cv ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <p className="text-2xl mb-2">📋</p>
            <p>This volunteer hasn't filled in their CV yet.</p>
            <p className="text-xs mt-1">{userEmail}</p>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Identity */}
            <div>
              <h3 className="font-bold text-foreground text-lg">{cv.cv_full_name || volunteerName}</h3>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                {age && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {age} years old</span>}
                {(cv.cv_city || cv.cv_country) && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {[cv.cv_city, cv.cv_country].filter(Boolean).join(", ")}</span>
                )}
                {cv.cv_phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {cv.cv_phone}</span>}
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {userEmail}</span>
              </div>
            </div>

            {/* About */}
            {cv.bio && <CVSection title="About">{cv.bio}</CVSection>}

            {/* Skills */}
            {allSkills.length > 0 && (
              <div>
                <SectionHeader title="Skills" />
                {cv.cv_primary_skills?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Primary</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cv.cv_primary_skills.map(s => (
                        <span key={s} className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(cv.cv_other_skills?.length > 0 || cv.cv_custom_skill) && (
                  <div className="flex flex-wrap gap-1.5">
                    {(cv.cv_other_skills || []).map(s => (
                      <span key={s} className="text-xs bg-muted text-foreground/70 font-medium px-2.5 py-1 rounded-full">{s}</span>
                    ))}
                    {cv.cv_custom_skill && (
                      <span className="text-xs bg-muted text-foreground/70 font-medium px-2.5 py-1 rounded-full">{cv.cv_custom_skill}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Languages */}
            {cv.cv_languages?.filter(l => l.language).length > 0 && (
              <div>
                <SectionHeader title="Languages" />
                <div className="flex flex-wrap gap-2">
                  {cv.cv_languages.filter(l => l.language).map((l, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-muted/40 rounded-xl px-3 py-1.5 text-xs">
                      <Globe className="w-3 h-3 text-muted-foreground" />
                      <span className="font-semibold">{l.language}</span>
                      <span className="text-muted-foreground">· {l.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {cv.cv_experience?.filter(e => e.org || e.role).length > 0 && (
              <div>
                <SectionHeader title="Experience" />
                <div className="space-y-2">
                  {cv.cv_experience.filter(e => e.org || e.role).map((exp, i) => (
                    <div key={i} className="border-l-2 border-primary/30 pl-3 py-0.5">
                      <p className="text-sm font-semibold text-foreground">{exp.role || "Volunteer"}</p>
                      <p className="text-xs text-primary font-medium">{exp.org}</p>
                      {exp.duration && <p className="text-xs text-muted-foreground">{exp.duration}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            {(cv.cv_availability || cv.cv_available_days?.length > 0 || cv.cv_start_date) && (
              <div>
                <SectionHeader title="Availability" />
                <div className="flex flex-wrap gap-2">
                  {cv.cv_availability && (
                    <span className="flex items-center gap-1.5 text-xs bg-muted/40 px-3 py-1.5 rounded-xl font-medium">
                      <Clock className="w-3 h-3 text-muted-foreground" /> {cv.cv_availability}
                    </span>
                  )}
                  {cv.cv_start_date && (
                    <span className="flex items-center gap-1.5 text-xs bg-muted/40 px-3 py-1.5 rounded-xl font-medium">
                      <Calendar className="w-3 h-3 text-muted-foreground" /> From {cv.cv_start_date}
                    </span>
                  )}
                </div>
                {cv.cv_available_days?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {cv.cv_available_days.map(d => (
                      <span key={d} className="text-xs bg-accent/20 text-accent-foreground font-medium px-2.5 py-1 rounded-full">{d}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Certifications */}
            {cv.cv_certifications && (
              <div>
                <SectionHeader title="Certifications" />
                <p className="text-sm text-foreground/80">{cv.cv_certifications}</p>
              </div>
            )}

            {/* Transport */}
            {(cv.cv_has_license || cv.cv_has_car || cv.cv_travel) && (
              <div>
                <SectionHeader title="Transport & Mobility" />
                <div className="flex flex-wrap gap-2">
                  {cv.cv_has_license && <Pill icon={<Star className="w-3 h-3" />} text="Driver's License" />}
                  {cv.cv_has_car && <Pill icon={<Car className="w-3 h-3" />} text="Own a Car" />}
                  {cv.cv_travel && <Pill icon={<Globe className="w-3 h-3" />} text={`Travel: ${cv.cv_travel}`} />}
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {(cv.cv_emergency_name || cv.cv_emergency_phone) && (
              <div>
                <SectionHeader title="Emergency Contact" />
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 flex flex-wrap gap-4">
                  {cv.cv_emergency_name && (
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <AlertCircle className="w-4 h-4 text-red-400" /> {cv.cv_emergency_name}
                    </span>
                  )}
                  {cv.cv_emergency_phone && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" /> {cv.cv_emergency_phone}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Uploaded CV */}
            {cv.uploaded_cv_url && (
              <a href={cv.uploaded_cv_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
                📎 View uploaded CV file
              </a>
            )}

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border">
              <BadgeCheck className="w-3.5 h-3.5 text-primary" />
              CV submitted via HeartsLinker
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <p className="text-[10px] font-bold text-foreground uppercase tracking-wide">{title}</p>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function CVSection({ title, children }) {
  return (
    <div>
      <SectionHeader title={title} />
      <p className="text-sm text-foreground/80 leading-relaxed">{children}</p>
    </div>
  );
}

function Pill({ icon, text }) {
  return (
    <div className="flex items-center gap-1.5 bg-muted/40 rounded-xl px-3 py-1.5 text-xs font-medium text-foreground">
      <span className="text-muted-foreground">{icon}</span> {text}
    </div>
  );
}