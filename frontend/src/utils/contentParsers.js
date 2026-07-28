export function parseStructuredMessageBody(body) {
  if (!body) {
    return { text: '', category: 'general', attachment: null, isBroadcast: false };
  }

  try {
    const parsed = JSON.parse(body);
    if (typeof parsed === 'object' && parsed !== null && 'text' in parsed) {
      return {
        text: parsed.text || '',
        category: parsed.category || 'general',
        attachment: parsed.attachment || null,
        isBroadcast: Boolean(parsed.isBroadcast),
      };
    }
  } catch {
    // Plain text legacy message.
  }

  return { text: body, category: 'general', attachment: null, isBroadcast: false };
}

export function parseAppointmentNotes(notes) {
  if (!notes) {
    return {
      legacyNotes: '',
      consultationSummary: '',
      followUpDirectives: '',
      prescriptionNotes: '',
    };
  }

  try {
    const parsed = JSON.parse(notes);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        legacyNotes: parsed.legacyNotes || '',
        consultationSummary: parsed.consultationSummary || '',
        followUpDirectives: parsed.followUpDirectives || '',
        prescriptionNotes: parsed.prescriptionNotes || '',
      };
    }
  } catch {
    return {
      legacyNotes: notes,
      consultationSummary: '',
      followUpDirectives: '',
      prescriptionNotes: '',
    };
  }

  return {
    legacyNotes: '',
    consultationSummary: '',
    followUpDirectives: '',
    prescriptionNotes: '',
  };
}