import { BASE_URL } from '../config';

export async function login({ email, password }) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });



  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Login failed';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function forgotPassword({ email }) {
  const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to send recovery email';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function resetPassword({ password }) {
  const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to reset password';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getDashboardStats(token) {
  const response = await fetch(`${BASE_URL}/api/crm/dashboard/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch dashboard stats';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getCustomersDataTable({
  token,
  pageIndex = 1,
  pageSize = 10,
  sort = { order: '', key: '' },
  query = '',
  filterData = { status: '' },
} = {}) {
  const response = await fetch(`${BASE_URL}/api/lead/customers/data-table`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ pageIndex, pageSize, sort, query, filterData }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch customers data';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getLeadsDataTable({
  token,
  pageIndex = 1,
  pageSize = 10,
  sort = { order: '', key: '' },
  query = '',
  filterData = { status: '' },
} = {}) {
  const authHeaders = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // New API contract uses GET with pagination query params.
  const params = new URLSearchParams({
    page: String(pageIndex),
    limit: String(pageSize),
  });

  if (query) params.set('query', query);
  if (sort?.order) params.set('order', sort.order);
  if (sort?.key) params.set('key', sort.key);
  if (filterData?.status) params.set('status', filterData.status);

  const getUrl = `${BASE_URL}/api/lead/data-table?${params.toString()}`;
  const getResponse = await fetch(getUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
  });

  const getData = await getResponse.json().catch(() => ({}));
  if (getResponse.ok) return getData;

  // Backward compatibility for older backend instances that still expect POST.
  const postResponse = await fetch(`${BASE_URL}/api/lead/data-table`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ pageIndex, pageSize, sort, query, filterData }),
  });

  const postData = await postResponse.json().catch(() => ({}));
  if (!postResponse.ok) {
    const message = postData?.message || getData?.message || 'Failed to fetch leads data';
    const error = new Error(message);
    error.status = postResponse.status;
    error.details = postData;
    throw error;
  }

  return postData;
}

export async function searchLeads({
  token,
  pageIndex = 1,
  pageSize = 10,
  searchQuery = '',
} = {}) {
  const url = `${BASE_URL}/api/lead/search`
  const payload = {
    pageIndex,
    pageSize,
    searchQuery: String(searchQuery || '').trim(),
  }

  console.log('[searchLeads] POST', url)
  console.log('[searchLeads] payload:', JSON.stringify(payload, null, 2))

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  console.log('[searchLeads] status:', response.status)
  console.log('[searchLeads] response:', JSON.stringify(data, null, 2))

  if (!response.ok) {
    const message = data?.message || 'Failed to search leads';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getLeadById({ token, id }) {
  const url = `${BASE_URL}/api/lead/${encodeURIComponent(id)}?id=${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch lead details';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function assignThreadToUser({ token, leadId, userId }) {
  const url = `${BASE_URL}/api/lead/assign-thread-to-user/${encodeURIComponent(leadId)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ userId }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to assign thread';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function assignThreadToMe({ token, leadId }) {
  const url = `${BASE_URL}/api/lead/assign-thread-to-me/${encodeURIComponent(leadId)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to assign thread to you';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getLeadUserList(token) {
  const response = await fetch(`${BASE_URL}/api/lead/user-list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch assignable users';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function markThreadAsRead({ token, leadId }) {
  const url = `${BASE_URL}/api/chats/mark-read/${encodeURIComponent(leadId)}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to mark thread as read';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function updateLead({ token, id, payload }) {
  const url = `${BASE_URL}/api/lead/update?id=${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to update lead';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getLeadNotes({ token, leadId }) {
  const url = `${BASE_URL}/api/lead/${encodeURIComponent(leadId)}/notes`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch lead notes';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function createLeadNote({ token, payload }) {
  const response = await fetch(`${BASE_URL}/api/lead/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to create note';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function updateLeadNote({ token, id, payload }) {
  const url = `${BASE_URL}/api/lead/notes?id=${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to update note';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function deleteLeadNote({ token, id }) {
  const url = `${BASE_URL}/api/lead/notes/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to delete note';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getLeadAttachments({ token, leadId }) {
  const url = `${BASE_URL}/api/chats/lead-attachments/${encodeURIComponent(leadId)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch lead attachments';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getAttachmentById({ token, id }) {
  const url = `${BASE_URL}/api/chats/attachment/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch attachment';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function deleteAttachment({ token, id }) {
  const url = `${BASE_URL}/api/chats/attachment/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to delete attachment';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getTestDriveInvitesByLead({ token, leadId }) {
  const url = `${BASE_URL}/api/chats/test-drive-invites/${encodeURIComponent(leadId)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch test drive invites';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function makeCallWithAgent({ token, phoneNumber, leadId }) {
  const url = `${BASE_URL}/api/call-agent/make-call`;
  const payload = {
    phoneNumber,
    ...(leadId != null ? { leadId } : {}),
  };

  console.log('[makeCallWithAgent] POST', url);
  console.log('[makeCallWithAgent] payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  console.log('[makeCallWithAgent] status:', response.status);
  console.log('[makeCallWithAgent] response:', JSON.stringify(data, null, 2));

  if (!response.ok) {
    const message = data?.message || 'Failed to start bot call';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getAgentCallStatus({ token, callSid }) {
  const url = `${BASE_URL}/api/call-agent/call-status/${encodeURIComponent(callSid)}`;

  console.log('[getAgentCallStatus] GET', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  console.log('[getAgentCallStatus] status:', response.status);
  console.log('[getAgentCallStatus] response:', JSON.stringify(data, null, 2));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch call status';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function hangupAgentCall({ token, callSid }) {
  const url = `${BASE_URL}/api/call-agent/hangup/${encodeURIComponent(callSid)}`;

  console.log('[hangupAgentCall] POST', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  console.log('[hangupAgentCall] status:', response.status);
  console.log('[hangupAgentCall] response:', JSON.stringify(data, null, 2));

  if (!response.ok) {
    const message = data?.message || 'Failed to hang up call';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getTwilioVoiceToken({ token, identity }) {
  const params = new URLSearchParams({
    identity: String(identity || 'redidial-mobile'),
  })
  const url = `${BASE_URL}/api/twilio/token?${params.toString()}`

  console.log('[getTwilioVoiceToken] GET', url)

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const data = await response.json().catch(() => ({}))

  console.log('[getTwilioVoiceToken] status:', response.status)
  console.log('[getTwilioVoiceToken] response:', JSON.stringify(data, null, 2))

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch Twilio voice token'
    const error = new Error(message)
    error.status = response.status
    error.details = data
    throw error
  }

  return data
}

export async function getCallSummariesForLead({ token, leadId }) {
  const url = `${BASE_URL}/api/call-summary/lead/${encodeURIComponent(leadId)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch call summaries';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getCallSummaryDetails({ token, callId, callType }) {
  const params = callType ? `?type=${encodeURIComponent(callType)}` : '';
  const url = `${BASE_URL}/api/call-summary/${encodeURIComponent(callId)}/details${params}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch call details';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

// Create chat message (text)
export async function sendChatMessage({ token, content, local_id, lead_id }) {
  const url = `${BASE_URL}/api/chats`
  const payload = { content, local_id: String(local_id), lead_id: String(lead_id) }

  console.log('[sendChatMessage] POST', url)
  console.log('[sendChatMessage] payload:', JSON.stringify(payload, null, 2))
  console.log(
    '[sendChatMessage] curl',
    `curl '${url}' -X 'POST' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${token || ''}' --data-raw '${JSON.stringify(payload)}'`,
  )

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  console.log('[sendChatMessage] status:', response.status)
  console.log('[sendChatMessage] response:', JSON.stringify(data, null, 2))

  if (!response.ok) {
    const message = data?.message || 'Failed to send message'
    const error = new Error(message)
    error.status = response.status
    error.details = data
    throw error
  }

  return data
}

// Create chat message with file (multipart/form-data)
export async function sendChatMessageWithFile({ token, content, local_id, lead_id, file }) {
  const formData = new FormData()
  if (content) formData.append('content', content)
  formData.append('local_id', String(local_id))
  formData.append('lead_id', String(lead_id))
  if (file?.uri && file?.name && file?.type) {
    formData.append('files', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    })
  }

  const response = await fetch(`${BASE_URL}/api/chats`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Let RN set the correct multipart boundary
    },
    body: formData,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.message || 'Failed to send message with file'
    const error = new Error(message)
    error.status = response.status
    error.details = data
    throw error
  }

  return data
}

export async function uploadChatAttachment({ token, chatId, file }) {
  const formData = new FormData()
  if (file?.uri && file?.name && file?.type) {
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    })
  }

  const response = await fetch(
    `${BASE_URL}/api/chats/upload/${encodeURIComponent(chatId)}`,
    {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    },
  )

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.message || 'Failed to upload attachment'
    const error = new Error(message)
    error.status = response.status
    error.details = data
    throw error
  }

  return data
}

export async function getVehiclesDataTable({
  token,
  pageIndex = 1,
  pageSize = 10,
  sort = { order: '', key: '' },
  query = '',
  filterData = { status: '' },
} = {}) {
  const response = await fetch(`${BASE_URL}/api/vehicles/data-table`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ pageIndex, pageSize, sort, query, filterData }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch vehicles data';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export function buildVehiclePatchPayload(original = {}, updates = {}) {
  const year = updates.year || original?.year || original?.vehicle_year || ''
  const make = updates.make || original?.make || original?.vehicle_make || ''
  const model = updates.model || original?.model || original?.vehicle_model || ''
  const vehicleName =
    updates.vehicle_name ||
    original?.vehicle_name ||
    original?.name ||
    [year, make, model].filter(Boolean).join(' ') ||
    ''

  const toDecimalString = (val) => {
    if (val === null || val === undefined || val === '') return null
    const num = Number(String(val).replace(/[^\d.]/g, ''))
    if (!Number.isFinite(num)) return String(val)
    return num.toFixed(2)
  }

  const emptyToNull = (val) => (val === '' || val === undefined ? null : val)

  return {
    vin: updates.vin ?? original?.vin ?? original?.vehicle_vin ?? '',
    vehicle_name: vehicleName,
    detailed_specification: original?.detailed_specification ?? null,
    img: original?.img ?? '',
    imgList: Array.isArray(original?.imgList) ? original.imgList : [],
    price: toDecimalString(updates.price ?? original?.price ?? original?.vehicle_price),
    price_currency: updates.price_currency ?? original?.price_currency ?? '$',
    mileage: toDecimalString(updates.mileage ?? original?.mileage ?? original?.odometer),
    engine: emptyToNull(updates.engine ?? original?.engine),
    transmission: emptyToNull(updates.transmission ?? original?.transmission),
    drivetrain: emptyToNull(updates.drivetrain ?? original?.drivetrain ?? original?.drive_type),
    exterior_color: emptyToNull(updates.exterior_color ?? updates.exterior ?? original?.exterior_color),
    interior_color: emptyToNull(updates.interior_color ?? updates.interior ?? original?.interior_color),
    fuel_economy_city: emptyToNull(updates.fuel_economy_city ?? original?.fuel_economy_city),
    fuel_economy_highway: emptyToNull(updates.fuel_economy_highway ?? original?.fuel_economy_highway),
    fuel: emptyToNull(updates.fuel ?? original?.fuel),
    cargurus_rating: emptyToNull(updates.rating ?? original?.cargurus_rating ?? original?.rating),
    condition: emptyToNull(updates.condition ?? original?.condition),
    stock: updates.stock ?? original?.stock ?? '',
    description: emptyToNull(updates.description ?? original?.description),
    created_at: original?.created_at ?? null,
    updated_at: original?.updated_at ?? null,
    orgId: original?.orgId ?? null,
  }
}

export function buildVehicleCreatePayload(form = {}) {
  const payload = buildVehiclePatchPayload({}, form)
  if (Array.isArray(form.imgList) && form.imgList.length > 0 && form.imgList[0]?.img) {
    payload.img = form.imgList[0].img
    payload.imgList = form.imgList
  }
  return payload
}

export async function createVehicle({ token, data }) {
  const url = `${BASE_URL}/api/vehicles`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = result?.message || 'Failed to create vehicle'
    const error = new Error(message)
    error.status = response.status
    error.details = result
    throw error
  }

  return result
}

export async function updateVehicle({ token, id, data }) {
  const url = `${BASE_URL}/api/vehicles/${id}`;

  console.log('[updateVehicle] PATCH', url);
  console.log('[updateVehicle] payload:', JSON.stringify(data, null, 2));
  console.log(
    `[updateVehicle] curl`,
    `curl '${url}' -X 'PATCH' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${token || ''}' --data-raw '${JSON.stringify(data)}'`,
  );

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json().catch(() => ({}));

  console.log('[updateVehicle] status:', response.status);
  console.log('[updateVehicle] response:', JSON.stringify(result, null, 2));

  if (!response.ok) {
    const message = result?.message || 'Failed to update vehicle';
    const error = new Error(message);
    error.status = response.status;
    error.details = result;
    throw error;
  }

  return result;
}

export async function getNotificationsListAll({ token, page = 1, size = 10 } = {}) {
  const url = `${BASE_URL}/api/notification/list-all?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch notifications';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getNotificationsList({ token, page = 1, size = 20 } = {}) {
  const url = `${BASE_URL}/api/notification/list?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch notifications';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getNotificationUnreadCount({ token } = {}) {
  const response = await fetch(`${BASE_URL}/api/notification/count`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch notification count';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function markNotificationRead({ token, notificationId } = {}) {
  const response = await fetch(`${BASE_URL}/api/notification/mark-read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ notificationId }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to mark notification as read';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function markAllNotificationsRead({ token } = {}) {
  const response = await fetch(`${BASE_URL}/api/notification/mark-all-read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to mark all notifications as read';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getTestDriveInvites({ token, start, end } = {}) {
  const params = new URLSearchParams();
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  const query = params.toString();
  const url = `${BASE_URL}/api/chats/test-drive-invites${query ? `?${query}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch test drive invites';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function registerDeviceToken({ token, fcmToken, platform }) {
  const response = await fetch(`${BASE_URL}/api/users/register-device`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      fcm_token: fcmToken,
      device_type: platform,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data?.message || `Failed to register device token (${response.status})`);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return { ...data, registered: true };
}

export async function getOrgUsers(token) {
  const response = await fetch(`${BASE_URL}/api/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch users';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}


export async function createUser({ token, payload }) {
  const response = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to create user';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}


export async function updateUser({ token, userId, payload }) {
  const response = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to update user';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  if (data?.success === false || data?.error) {
    const message = data?.message || data?.error || 'Failed to update user';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}


export async function deactivateUser({ token, userId }) {
  const response = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to deactivate user';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}


export async function getOrganizationDetails(token) {
  const response = await fetch(`${BASE_URL}/api/organizations/details`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch organization details';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}
// channel APIS's
export async function getChatChannels(token) {
  const response = await fetch(`${BASE_URL}/api/chats/channel`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch chat channels';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}


export async function getChannelUsersByChannel({ token, channelId }) {
  const response = await fetch(`${BASE_URL}/api/channel-user/by-channel/${encodeURIComponent(channelId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch channel users';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function createChannel({ token, payload }) {
  const response = await fetch(`${BASE_URL}/api/channel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to create channel';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}
export async function configureChannel({ token, payload }) {
  const response = await fetch(`${BASE_URL}/api/channel/configure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to configure channel';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getChannelConfiguration(token) {
  const response = await fetch(`${BASE_URL}/api/channel/configuration`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch channel configuration';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function linkChannelUser({ token, payload }) {
  const response = await fetch(`${BASE_URL}/api/channel-user/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to link user to channel';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}
// < ====================== >

export async function updateMyOrganization({ token, payload }) {
  const response = await fetch(`${BASE_URL}/api/organizations/update-my-org`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to update organization';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

// <========== team messages (internal chat) ==========>
export async function getInternalConversations(token) {
  const response = await fetch(`${BASE_URL}/api/internal-chat/conversations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch conversations';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function createInternalConversation({ token, peerUserId }) {
  const response = await fetch(`${BASE_URL}/api/internal-chat/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ peerUserId }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to create conversation';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function markInternalConversationRead({ token, conversationId }) {
  const url = `${BASE_URL}/api/internal-chat/conversations/${encodeURIComponent(conversationId)}/read`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 404) {
    return { ok: false, skipped: true };
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to mark conversation as read';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getInternalMessages({ token, conversationId, limit = 80, cursor } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor != null) params.set('cursor', String(cursor));

  const url = `${BASE_URL}/api/internal-chat/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch messages';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

/** @deprecated Use getInternalConversations */
export const getTeamChats = getInternalConversations;

/** @deprecated Use getInternalMessages */
export async function getTeamMessages({ token, userId, conversationId }) {
  if (conversationId) {
    return getInternalMessages({ token, conversationId });
  }
  throw new Error('conversationId is required for team messages');
}

/** @deprecated Team messages are sent via Socket.IO internalChatSend */
export async function sendTeamMessage() {
  throw new Error('Team messages must be sent via socket (internalChatSend)');
}

// <========== chat ==========>
  export async function getGmailV2Authorization({ token }) {
    const response = await fetch(`${BASE_URL}/api/gmail_v2/api/authorization`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  
    const data = await response.json().catch(() => ({}));
  
    if (!response.ok) {
      const message = data?.message || 'Failed to get Gmail authorization';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }
  
    return data;
  }
  export async function getOrganizationLinkedStatus(token) {
    const response = await fetch(`${BASE_URL}/api/organizations/linked-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  
    const data = await response.json().catch(() => ({}));
  
    if (!response.ok) {
      const message = data?.message || 'Failed to fetch organization linked status';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }
  
    return data;
  }
  async function gmailV2Post({ token, path, payload = {} }) {
    const response = await fetch(`${BASE_URL}/api/gmail_v2/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || `Request failed (${path})`;
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  }

  export async function testImapConnection({ token, payload }) {
    return gmailV2Post({ token, path: 'test/imap', payload });
  }

  export async function connectImapAccount({ token, payload }) {
    return gmailV2Post({ token, path: 'connect/imap', payload });
  }

  export async function testPop3Connection({ token, payload }) {
    return gmailV2Post({ token, path: 'test/pop3', payload });
  }

  export async function connectPop3Account({ token, payload }) {
    return gmailV2Post({ token, path: 'connect/pop3', payload });
  }

  export async function disconnectOrganizationLinkedStatus({ token }) {
    const response = await fetch(`${BASE_URL}/api/organizations/linked-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status: null }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || 'Failed to disconnect linked account';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  }

  export async function getFacebookAuthorization({ token }) {
    const response = await fetch(`${BASE_URL}/api/facebook/api/authorization`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || 'Failed to get Facebook authorization';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  }

  export async function getOrganizationFacebookLinkedStatus(token) {
    const response = await fetch(`${BASE_URL}/api/organizations/facebook-linked-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || 'Failed to fetch Facebook linked status';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  }

  export async function disconnectOrganizationFacebookLinkedStatus({ token }) {
    const response = await fetch(`${BASE_URL}/api/organizations/facebook-linked-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status: null }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || 'Failed to disconnect Facebook account';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  }

  /** @deprecated Use disconnectOrganizationLinkedStatus */
  export async function getOrganizationStatusUpdate({ token, payload = {} }) {
    if (payload?.status === null || payload?.status === undefined) {
      return disconnectOrganizationLinkedStatus({ token });
    }
    const response = await fetch(`${BASE_URL}/api/organizations/linked-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || 'Failed to update organization linked status';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  }


  export async function getDncDataTable({
    token,
    pageIndex = 1,
    pageSize = 10,
    sort = { order: '', key: '' },
    query = '',
  } = {}) {
    const response = await fetch(`${BASE_URL}/api/dnc/data-table`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pageIndex, pageSize, sort, query }),
    });
    const data = await response.json().catch(() => ({}));
  
    if (!response.ok) {
      const message = data?.message || 'Failed to fetch DNC data';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }
  
    return data;
  }
  
  export async function getDncDataRemove({ token, number, orgId }) {
    const payload = orgId ? { number, orgId } : { number }
    const response = await fetch(`${BASE_URL}/api/dnc/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  
    const data = await response.json().catch(() => ({}));
  
    if (!response.ok) {
      const message = data?.message || 'Failed to remove DNC data';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }
  
    return data;
  }
  
  export async function getDncDataAdd({ token, payload }) {
    const response = await fetch(`${BASE_URL}/api/dnc/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || 'Failed to add to DNC list';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }
  
    return data;
  }
  export async function getDncDataCheck({ token, number, orgId }) {
    const url = `${BASE_URL}/api/dnc/check?number=${encodeURIComponent(number)}&orgId=${encodeURIComponent(orgId)}`;
  
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  
    const data = await response.json().catch(() => ({}));
  
    if (!response.ok) {
      const message = data?.message || 'Failed to check DNC data';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }
  
    return data;
  }
  export async function getImportSessions({ token }) {
    const url = `${BASE_URL}/api/vehicles/import-sessions`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || 'Failed to fetch import sessions';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  }

  export async function getImportSessionById({ token, id }) {
    const url = `${BASE_URL}/api/vehicles/import-sessions/${encodeURIComponent(id)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || 'Failed to fetch import session';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  }

  export async function importVehiclesWithMapping({ token, file, mapping }) {
    const url = `${BASE_URL}/api/vehicles/import-with-mapping`;
    const formData = new FormData();

    formData.append('file', {
      uri: file.uri,
      type: file.type || 'text/csv',
      name: file.name || 'vehicles.csv',
    });
    formData.append('mapping', JSON.stringify(mapping));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || 'Failed to start vehicle import';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  }

  export async function getImportWithMapping({ token, payload }) {
    return importVehiclesWithMapping({
      token,
      file: payload?.file,
      mapping: payload?.mapping,
    });
  }

  export async function getOrganizationPreferences(token) {
    const response = await fetch(
      `${BASE_URL}/api/organizations/preferences?_=${Date.now()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || 'Failed to fetch organization preferences';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  }
  
export async function getOrganizationStats({ token, orgId }) {
  const response = await fetch(`${BASE_URL}/api/organizations/${orgId}/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch organization stats';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

async function stripePost({ token, path, payload = {} }) {
  const response = await fetch(`${BASE_URL}/api/stripe/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || `Stripe request failed (${path})`;
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function createStripeCheckoutSession({ token, payload }) {
  return stripePost({ token, path: 'create-checkout-session', payload });
}

export async function verifyStripeCheckoutSession({ token, sessionId }) {
  return stripePost({
    token,
    path: 'verify-checkout-session',
    payload: { sessionId, session_id: sessionId },
  });
}

export async function getStripeSubscription({ token, subscriptionId }) {
  return stripePost({
    token,
    path: 'get-subscription',
    payload: { subscriptionId, subscription_id: subscriptionId },
  });
}

export async function cancelStripeSubscription({ token, subscriptionId }) {
  return stripePost({
    token,
    path: 'cancel-subscription',
    payload: { subscriptionId, subscription_id: subscriptionId },
  });
}

export async function getActiveStripeSubscription({ token, email }) {
  return stripePost({
    token,
    path: 'get-active-subscription',
    payload: { email },
  });
}

export async function getActiveStripeSubscriptionByUser({ token, userId }) {
  return stripePost({
    token,
    path: 'get-active-subscription-by-user',
    payload: { userId, user_id: userId },
  });
}

export async function getStripeUserInvoices({ token, userId }) {
  return stripePost({
    token,
    path: 'get-user-invoices',
    payload: { userId, user_id: userId },
  });
}

export async function getStripeUserInvoicesByEmail({ token, email }) {
  return stripePost({
    token,
    path: 'get-user-invoices-by-email',
    payload: { email },
  });
}

async function user2faRequest({ token, method = 'GET', path, payload }) {
  const response = await fetch(`${BASE_URL}/api/users/2fa/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(method !== 'GET' ? { body: JSON.stringify(payload || {}) } : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || `2FA request failed (${path})`;
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getUser2faStatus(token) {
  return user2faRequest({ token, path: 'status' });
}

export async function generateUser2fa({ token }) {
  return user2faRequest({ token, method: 'POST', path: 'generate' });
}

export async function verifyUser2faToken({ token, totpToken }) {
  return user2faRequest({
    token,
    method: 'POST',
    path: 'verify',
    payload: { token: totpToken },
  });
}

export async function enableUser2fa({ token, totpToken }) {
  return user2faRequest({
    token,
    method: 'POST',
    path: 'enable',
    payload: { token: totpToken },
  });
}

export async function reEnableUser2fa({ token, totpToken }) {
  return user2faRequest({
    token,
    method: 'POST',
    path: 're-enable',
    payload: { token: totpToken },
  });
}

export async function disableUser2fa({ token, totpToken }) {
  return user2faRequest({
    token,
    method: 'POST',
    path: 'disable',
    payload: totpToken ? { token: totpToken } : {},
  });
}

export async function regenerateUser2faBackupCodes({ token }) {
  return user2faRequest({
    token,
    method: 'POST',
    path: 'backup-codes/regenerate',
  });
}

export async function verify2faAtLogin({ token, tempToken, email }) {
  const response = await fetch(`${BASE_URL}/api/auth/verify-2fa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      tempToken,
      temp_token: tempToken,
      email,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || '2FA verification failed';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getLeadNotificationPreferences(token) {
  const response = await fetch(`${BASE_URL}/api/organizations/lead-notification-preferences`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch lead notification preferences';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function saveLeadNotificationPreferences(token, notifiedUserIds = []) {
  const response = await fetch(`${BASE_URL}/api/organizations/lead-notification-preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      notified_user_ids: notifiedUserIds,
      notifiedUserIds,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to save lead notification preferences';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function getLeadSummarySettings(token) {
  const response = await fetch(`${BASE_URL}/api/organizations/lead-summary-settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch lead summary settings';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function saveLeadSummarySettings(token, settings = {}) {
  const response = await fetch(`${BASE_URL}/api/organizations/lead-summary-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(settings),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to save lead summary settings';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function sendLeadSummaryTest(token) {
  const response = await fetch(`${BASE_URL}/api/organizations/lead-summary-settings/send-test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to send test summary';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

  export async function updateOrganizationPreferences(token, preferences) {
    const response = await fetch(`${BASE_URL}/api/organizations/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(preferences),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || 'Failed to update organization preferences';
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  }
  
  export default {
    login,
    forgotPassword,
    resetPassword,
    getDashboardStats,
    getCustomersDataTable,
    getLeadsDataTable,
    searchLeads,
    getLeadById,
    assignThreadToUser,
    assignThreadToMe,
    getLeadUserList,
    markThreadAsRead,
    updateLead,
    getLeadNotes,
    createLeadNote,
    updateLeadNote,
    deleteLeadNote,
    getLeadAttachments,
    getAttachmentById,
    deleteAttachment,
    getTestDriveInvitesByLead,
    makeCallWithAgent,
    getAgentCallStatus,
    hangupAgentCall,
    getTwilioVoiceToken,
    getCallSummariesForLead,
    getCallSummaryDetails,
    sendChatMessage,
    sendChatMessageWithFile,
    getVehiclesDataTable,
    createVehicle,
    updateVehicle,
    buildVehiclePatchPayload,
    buildVehicleCreatePayload,
    getNotificationsListAll,
    getTestDriveInvites,
    registerDeviceToken,
    getOrgUsers,
    getInternalConversations,
    createInternalConversation,
    markInternalConversationRead,
    getInternalMessages,
    getTeamChats,
    getTeamMessages,
    sendTeamMessage,
    createUser,
    updateUser,
    deactivateUser,
    getOrganizationDetails,
    getChannelUsersByChannel,
    getChannelConfiguration,
    updateMyOrganization,
    configureChannel,
    createChannel,
    getChatChannels,
    linkChannelUser,
    getGmailV2Authorization,
    getOrganizationLinkedStatus,
    getOrganizationStatusUpdate,
    disconnectOrganizationLinkedStatus,
    getFacebookAuthorization,
    getOrganizationFacebookLinkedStatus,
    disconnectOrganizationFacebookLinkedStatus,
    testImapConnection,
    connectImapAccount,
    testPop3Connection,
    connectPop3Account,
    getDncDataTable,
    getDncDataRemove,
    getDncDataAdd,
    getDncDataCheck, 
    getImportSessions,
    getImportSessionById,
    importVehiclesWithMapping,
    getImportWithMapping,
    getOrganizationPreferences,
    updateOrganizationPreferences,
    getOrganizationStats,
    createStripeCheckoutSession,
    verifyStripeCheckoutSession,
    getStripeSubscription,
    cancelStripeSubscription,
    getActiveStripeSubscription,
    getActiveStripeSubscriptionByUser,
    getStripeUserInvoices,
    getStripeUserInvoicesByEmail,
    getUser2faStatus,
    generateUser2fa,
    verifyUser2faToken,
    enableUser2fa,
    reEnableUser2fa,
    disableUser2fa,
    regenerateUser2faBackupCodes,
    verify2faAtLogin,
    getLeadNotificationPreferences,
    saveLeadNotificationPreferences,
    getLeadSummarySettings,
    saveLeadSummarySettings,
    sendLeadSummaryTest,
  };
  