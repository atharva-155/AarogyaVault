import React from 'react';

export default function PatientCard({ citizen, showInsurance = false }) {
  const noAllergy = !citizen.allergies || citizen.allergies.toLowerCase() === 'none';
  const age = citizen.dob
    ? Math.floor((new Date() - new Date(citizen.dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="profile-card fade-in">
      <div className="profile-card-header">
        <div>
          <div className="profile-name">{citizen.full_name}</div>
          <div className="profile-meta">
            {citizen.gender}{age ? `, ${age} years` : ''} &nbsp;·&nbsp;
            {citizen.dob || '—'}
          </div>
        </div>
        <div className="blood-badge">{citizen.blood_group}</div>
      </div>
      <div className="profile-card-body">

        {!noAllergy && (
          <div className="allergy-box">
            <div className="allergy-box-title">⚠ Allergy Alert</div>
            <div className="allergy-box-text">{citizen.allergies}</div>
          </div>
        )}

        <div className="profile-row">
          <div className="profile-field">
            <label>Chronic Conditions</label>
            <div className="value">{citizen.chronic_conditions || 'None'}</div>
          </div>
          <div className="profile-field">
            <label>Current Medications</label>
            <div className="value">{citizen.current_medications || 'None'}</div>
          </div>
        </div>

        <div className="emergency-box">
          <div>
            <div className="emergency-box-label">Emergency Contact</div>
            <div style={{ color: 'white', fontWeight: 600 }}>{citizen.emergency_contact_name}</div>
          </div>
          <div className="emergency-phone">📞 {citizen.emergency_contact_phone}</div>
        </div>

        <div className="profile-row">
          <div className="profile-field">
            <label>Organ Donor</label>
            <div className="value">
              <span className={`tag ${citizen.organ_donor ? 'tag-success' : 'tag-muted'}`}>
                {citizen.organ_donor ? 'Yes — Registered Donor' : 'Not Registered'}
              </span>
            </div>
          </div>
          {noAllergy && (
            <div className="profile-field">
              <label>Known Allergies</label>
              <div className="value"><span className="tag tag-success">No Known Allergies</span></div>
            </div>
          )}
        </div>

        {showInsurance && citizen.insurance_provider && (
          <div className="profile-row">
            <div className="profile-field">
              <label>Insurance Provider</label>
              <div className="value">{citizen.insurance_provider}</div>
            </div>
            <div className="profile-field">
              <label>Policy Number</label>
              <div className="value" style={{ fontFamily: 'var(--mono)', fontSize: '0.88rem' }}>
                {citizen.insurance_policy_number || '—'}
              </div>
            </div>
          </div>
        )}

        {citizen.id && (
          <div className="vault-id-box">
            <div className="vault-id-label">AarogyaVault ID</div>
            <div className="vault-id-value">{citizen.id}</div>
          </div>
        )}

      </div>
    </div>
  );
}
