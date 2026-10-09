import { useState, useMemo, useEffect } from 'react';
import { Box, Button, Paper, Typography, Stack, TextField, MenuItem } from '@mui/material';
import Toolbar from '../components/toolbar';

export default function HomeFab5() {
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [lockerDetails, setLockerDetails] = useState({ name: '', shift: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [areasName, setAreasName] = useState([]);
  const [lockers, setLockers] = useState([]);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseStatus, setResponseStatus] = useState('');
  const [responseError, setResponseError] = useState('');
  const [historylogs, setHistoryLogs] = useState([]);

  const lockerGrid = useMemo(() => {
    if (!Array.isArray(lockers) || lockers.length === 0) return [];

    const ROW_COUNT = 5;
    const COL_COUNT = 4;

    const cabinetsMap = {};
    lockers.forEach((locker) => {
      const cab = String(locker.cabinetnumber || '0');
      if (!cabinetsMap[cab]) {
        const rows = Array.from({ length: ROW_COUNT }, () => Array.from({ length: COL_COUNT }, () => null));
        cabinetsMap[cab] = { id: cab, rows };
      }

      const ln = String(locker.lockernumber || '');
      const m = ln.match(/^(\d+)([A-Za-z])$/);
      if (m) {
        const r = Math.max(1, Math.min(ROW_COUNT, parseInt(m[1], 10))) - 1;
        const c = Math.max(0, Math.min(COL_COUNT - 1, m[2].toUpperCase().charCodeAt(0) - 65));
        cabinetsMap[cab].rows[r][c] = locker;
      } else {
        const rows = cabinetsMap[cab].rows;
        let placed = false;
        for (let i = 0; i < ROW_COUNT && !placed; i++) {
          for (let j = 0; j < COL_COUNT && !placed; j++) {
            if (!rows[i][j]) {
              rows[i][j] = locker;
              placed = true;
            }
          }
        }
      }
    });

    return Object.keys(cabinetsMap)
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => {
        const c = cabinetsMap[key];
        const rows = c.rows.map((row) => row.map((cell) => cell || { lockernumber: '', statusnow: 'available' }));
        return { id: key, rows };
      });
  }, [lockers]);

  const stats = useMemo(() => {
    let available = 0;
    let occupied = 0;
    let defective = 0;

    for (const locker of lockers) {
      const s = locker.statusnow || locker.status;
      if (s === 'available') available++;
      else if (s === 'occupied') occupied++;
      else if (s === 'defective') defective++;
    }

    return { available, occupied, defective };
  }, [lockers]);

  useEffect(() => {
    async function fetchAreas() {
      try {
        const response = await fetch('http://10.3.10.20:5001/getArealist');
        const data = await response.json();
        const areaList = Array.isArray(data.areas) ? data.areas.map((area) => area.area) : [];
        setAreasName(areaList);

        if (areaList.length > 0) {
          setSelectedArea((prev) => prev || areaList[0]);
        }
      } catch (error) {
        console.error('Error fetching areas:', error);
      }
    }

    fetchAreas();
  }, []);

  useEffect(() => {
    if (!selectedArea) return;
    fetchLockers(selectedArea);
  }, [selectedArea]);

  async function fetchLockers(selectedAreaName) {
    if (!selectedAreaName) return [];
    try {
      const response = await fetch(`http://10.3.10.20:5001/getCabinetsDetails/${selectedAreaName}`);
      const data = await response.json();
      const lockersData = Array.isArray(data.data) ? data.data : [];
      setLockers(lockersData);
      return lockersData;
    } catch (error) {
      console.error('Error fetching lockers:', error);
      return [];
    }
  }

  async function fetchHistoryLogs(selectedLockerRecord) {
    if (!selectedLockerRecord) return [];
    try {
      const response = await fetch(`http://10.3.10.20:5001/getHistoryLogs/${selectedLockerRecord.id}`);
      const data = await response.json();
      setHistoryLogs(Array.isArray(data.data) ? data.data : []);
      return data;
    } catch (error) {
      console.error('Error fetching history logs:', error);
      return [];
    }
  }

  useEffect(() => {
    if (!selectedLocker) {
      setHistoryLogs([]);
      return;
    }
    fetchHistoryLogs(selectedLocker);
  }, [selectedLocker]);

  function Locker({ locker }) {
    const status = locker.statusnow || locker.status || 'available';
    const isDefective = status === 'defective';
    const isSelected = selectedLocker && selectedLocker.id === locker.id;
    const color =
      status === 'available' ? '#4caf50' : status === 'occupied' ? '#9e9e9e' : '#f44336';

    return (
      <div
        onClick={() => {
          if (isDefective) return;

          setSelectedLocker(locker);
          const nameVal = locker.occupants
            ? locker.occupants.join(', ')
            : locker.name || '';
          setLockerDetails({ name: nameVal, shift: locker.shift || '' });
          setSelectedStatus(status);
          setIsEditing(true);
        }}
        title={`${locker.lockernumber || locker.id} - ${status}`}
        style={{
          width: 52,
          height: 40,
          margin: 6,
          background: color,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          cursor: isDefective ? 'not-allowed' : 'pointer',
          opacity: isDefective ? 0.9 : 1,
          boxShadow: isSelected ? '0 0 0 3px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.15)',
          border: isDefective ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.25)',
          fontWeight: 700,
          fontSize: 13,
          transition: 'all 0.2s ease',
        }}
      >
        {locker.lockernumber || locker.id}
      </div>
    );
  }

  const handleSaveChangesButton = () => {
    if (!selectedLocker) return;
    handleSaveChanges(selectedLocker.id);
  };

  async function handleSaveChanges(selectedId) {
    try {
      const response = await fetch(`http://10.3.10.20:5001/updateLockerDetails/${selectedId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: lockerDetails.name,
          shift: lockerDetails.shift,
          statusnow: selectedStatus,
          area: selectedArea,
          locker: selectedLocker.lockernumber,
          cabinet: selectedLocker.cabinetnumber,
        }),
      });

      const result = await response.json();
      setResponseMessage(result.message || 'Saved successfully');
      setResponseStatus(result.status || 'success');
      setResponseError(result.error || '');

      if (!response.ok) {
        setResponseStatus('error');
        return;
      }

      const refreshedLockers = await fetchLockers(selectedArea);
      const matchedLocker = Array.isArray(refreshedLockers)
        ? refreshedLockers.find((locker) => locker.id === selectedId)
        : null;

      const updatedLocker = matchedLocker || {
        ...selectedLocker,
        name: lockerDetails.name,
        shift: lockerDetails.shift,
        statusnow: selectedStatus,
      };

      if (Array.isArray(refreshedLockers)) {
        setLockers(refreshedLockers);
      }

      setSelectedLocker(updatedLocker);
      setIsEditing(false);
    } catch (error) {
      setResponseStatus('error');
      setResponseError('Failed to save changes');
      setResponseMessage('Failed to save changes');
    }
  }
  useEffect(() => {
      async function fetchRequestType() {
        try{
          const response = await fetch('http://10.3.10.20:5001/getRequestType');
          if (!response.ok) throw new Error('Unable to load requests.');
          const data = await response.json();
          setNotificationCount(Array.isArray(data.logs) ? data.logs.length : 0);
        } catch (error) {
          console.error('Error fetching request count:', error);
        } 
      }
      fetchRequestType();
    }, []);

    const handleLogout = () => {
      
    }

  return (
    <Box>
      <Toolbar userName="Admin" requestCount={0} notificationCount={notificationCount} onLogout={handleLogout} />
      <Box sx={{ fontFamily: 'Segoe UI, system-ui, Arial', p: 3, pt: 4, background: '#f5f7fb', minHeight: '100vh' }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontFamily: 'system-ui',
            fontWeight: 800,
            letterSpacing: 0.2,
            color: '#1f2937',
            mb: 3,
          }}
        >
          Locker Map - Street Shoes & Gown Area
        </Typography>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="stretch">
          <Paper
            sx={{
              width: { xs: '100%', lg: 280 },
              flexShrink: 0,
              p: 2.5,
              borderRadius: 3,
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid #e5e7eb',
              boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
            }}
          >
            <Typography sx={{ fontWeight: 700, color: '#111827', mb: 1.5 }}>Select Area</Typography>
            <Stack spacing={1}>
              {areasName.map((a) => (
                <Button
                  key={a}
                  variant={a === selectedArea ? 'contained' : 'outlined'}
                  color={a === selectedArea ? 'primary' : 'inherit'}
                  onClick={() => {
                    setSelectedArea(a);
                    setSelectedLocker(null);
                    setIsEditing(false);
                  }}
                  fullWidth
                  sx={{
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    py: 1,
                    fontWeight: 600,
                  }}
                >
                  {a}
                </Button>
              ))}
            </Stack>

            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                Summary
              </Typography>
              <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 1.5 }}>
                <Stat label="Available" value={stats.available} color="#4caf50" />
                <Stat label="Occupied" value={stats.occupied} color="#9e9e9e" />
                <Stat label="Defective" value={stats.defective} color="#f44336" />
              </Stack>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#374151' }}>
                Selected Locker: {selectedLocker ? `${selectedLocker.lockernumber} (${selectedLocker.statusnow || selectedLocker.status || 'available'})` : 'None'}
              </Typography>

              {selectedLocker && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {!isEditing ? (
                    <>
                      <InfoRow label="Name" value={selectedLocker.name || '—'} />
                      <InfoRow label="Shift" value={selectedLocker.shift || '—'} />
                      <InfoRow label="Status" value={selectedLocker.statusnow || selectedLocker.status || 'available'} />
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => setIsEditing(true)}
                          disabled={selectedLocker.statusnow === 'defective' || selectedLocker.status === 'defective'}
                        >
                          Edit
                        </Button>
                      </Stack>
                    </>
                  ) : (
                    <>
                      <TextField
                        select
                        size="small"
                        label="Status"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        <MenuItem value="occupied">Occupied</MenuItem>
                        <MenuItem value="available">Available</MenuItem>
                        <MenuItem value="defective">Defective</MenuItem>
                      </TextField>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                          fullWidth
                          size="small"
                          label="Name"
                          value={lockerDetails.name}
                          onChange={(e) => setLockerDetails((s) => ({ ...s, name: e.target.value }))}
                          disabled={selectedStatus === 'defective'}
                        />
                        {selectedStatus === 'available' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setLockerDetails((s) => ({ ...s, name: '' }))}
                            disabled={!lockerDetails.name}
                          >
                            Clear
                          </Button>
                        )}
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                          fullWidth
                          size="small"
                          label="Shift"
                          value={lockerDetails.shift}
                          onChange={(e) => setLockerDetails((s) => ({ ...s, shift: e.target.value }))}
                          disabled={selectedStatus === 'defective'}
                        />
                        {selectedStatus === 'available' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setLockerDetails((s) => ({ ...s, shift: '' }))}
                            disabled={!lockerDetails.shift}
                          >
                            Clear
                          </Button>
                        )}
                      </Stack>

                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Button size="small" variant="contained" onClick={handleSaveChangesButton}>
                          Save Changes
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setLockerDetails({
                              name: selectedLocker.name || '',
                              shift: selectedLocker.shift || '',
                            });
                            setSelectedStatus(selectedLocker.statusnow || selectedLocker.status || 'available');
                            setIsEditing(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </>
                  )}
                </Box>
              )}
            </Box>

            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: '#f9fafb',
                borderRadius: 2,
                border: '1px solid #e5e7eb',
                backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25, color: '#111827' }}>
                Recent History
              </Typography>

              {selectedLocker ? (
                historylogs && historylogs.length > 0 ? (
                  <Stack spacing={1}>
                    {historylogs.slice(0, 5).map((log, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 1.25,
                          bgcolor: '#ffffff',
                          borderRadius: 1.5,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          border: '1px solid #eef2f7',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>
                          {log.activity || log.event || 'Activity'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(() => {
                            const raw = log.dateupdate || log.date || log.time;
                            const date = new Date(raw);
                            return raw && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : 'No timestamp';
                          })()}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, color: '#424242' }}>
                          {log.shift || 'No Recent Shift Change.'}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, color: '#424242' }}>
                          Previous owner: {log.prevowner || 'No Recent Name Change.'}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No recent history log entries for this locker.
                  </Typography>
                )
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a locker to view recent history.
                </Typography>
              )}
            </Box>

            {(responseStatus || responseError) && (
              <Typography
                variant="body2"
                color={responseStatus === 'success' ? 'success.main' : 'error.main'}
                sx={{ mt: 1.5, fontWeight: 600 }}
              >
                {responseMessage || responseError || 'Update complete'}
              </Typography>
            )}
          </Paper>

          <Box sx={{ flex: 1 }}>
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e5e7eb',
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
              }}
            >
              <Typography sx={{ mb: 1.5, fontWeight: 700, color: '#111827' }}>{selectedArea} - Map</Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 2,
                  flexWrap: 'wrap',
                  p: 1.5,
                  bgcolor: '#fafafa',
                  borderRadius: 2,
                  border: '1px solid #edf2f7',
                }}
              >
                {lockerGrid.map((cabinet) => (
                  <Box
                    key={cabinet.id}
                    sx={{
                      mb: 2,
                      border: '1px solid #dfe7f1',
                      borderRadius: 2,
                      p: 1.25,
                      mr: 0,
                      background: '#ffffff',
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 0.75,
                        fontFamily: 'Segoe UI, system-ui, Arial',
                        fontWeight: 800,
                        color: '#334155',
                      }}
                    >
                      Cabinet {cabinet.id}
                    </Typography>

                    {(cabinet.rows || []).map((row, ri) => (
                      <Box key={ri} sx={{ display: 'flex' }}>
                        {row.map((lk, ci) => (
                          <Locker key={`${lk.lockernumber || 'empty'}-${ri}-${ci}`} locker={lk} />
                        ))}
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 6 }}>
      <div style={{ width: 12, height: 12, background: color, borderRadius: 2 }} />
      <div style={{ fontSize: 14 }}>
        <strong>{value}</strong> <span style={{ color: '#666' }}>{label}</span>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ fontSize: 14, color: '#374151', background: '#f8fafc', borderRadius: 8, padding: '8px 10px', border: '1px solid #eef2f7' }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}
