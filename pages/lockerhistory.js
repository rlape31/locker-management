import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import Toolbar from '../components/toolbar';

const API_BASE_URL = 'http://10.3.10.20:5001';

const normalizeLockerValue = (locker) => {
  if (!locker && locker !== 0) return '';
  if (typeof locker === 'object') {
    return locker.lockernumber ?? locker.id ?? '';
  }
  return String(locker).trim();
};

const matchesValue = (left, right) => String(left ?? '').trim() === String(right ?? '').trim();

const getListValue = (value, key) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && Array.isArray(value[key])) return value[key];
  return [];
};

export default function LockerHistoryPage() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedCabinet, setSelectedCabinet] = useState('');
  const [selectedLocker, setSelectedLocker] = useState('');
  const [appliedArea, setAppliedArea] = useState('');
  const [appliedCabinet, setAppliedCabinet] = useState('');
  const [appliedLocker, setAppliedLocker] = useState('');

  const [historyLogs, setHistoryLogs] = useState([]);
  const [areasName, setAreasName] = useState([]);
  const [cabinetnumber, setCabinetnumber] = useState([]);
  const [lockernumber, setLockernumber] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const filteredRecords = useMemo(
    () =>
      historyLogs.filter((record) => {
        if (appliedArea && !matchesValue(record.area, appliedArea)) {
          return false;
        }
        if (appliedCabinet && !matchesValue(record.cabinetnumber, appliedCabinet)) {
          return false;
        }
        if (appliedLocker && !matchesValue(record.lockernumber, normalizeLockerValue(appliedLocker))) {
          return false;
        }
        return true;
      }),
    [historyLogs, appliedArea, appliedCabinet, appliedLocker]
  );

  const hasFilterSelected = Boolean(selectedArea || selectedCabinet || selectedLocker);

  async function fetchAreas() {
    try {
      const response = await fetch(`${API_BASE_URL}/getArealist`);
      const data = await response.json();
      const areaList = getListValue(data?.areas, 'area').map((area) => area.area ?? area);
      setAreasName(areaList);
    } catch (error) {
      console.error('Error fetching areas:', error);
      setAreasName([]);
    }
  }

  async function fetchCabinets(area) {
    if (!area) return [];

    try {
      const response = await fetch(`${API_BASE_URL}/getCabinetsNumbers/${area}`);
      const data = await response.json();
      const cabinetNumbers = Array.isArray(data?.cabinets) ? data.cabinets : [];
      setCabinetnumber(cabinetNumbers);
      return cabinetNumbers;
    } catch (error) {
      console.error('Error fetching cabinets:', error);
      setCabinetnumber([]);
      return [];
    }
  }

  async function fetchLockers(area, cabinet) {
    if (!area || !cabinet) return [];

    try {
      const response = await fetch(`${API_BASE_URL}/getLockernumber/${area}/${cabinet}`);
      const data = await response.json();
      const lockerNumbers = Array.isArray(data?.lockerlist) ? data.lockerlist : [];
      setLockernumber(lockerNumbers);
      return lockerNumbers;
    } catch (error) {
      console.error('Error fetching lockers:', error);
      setLockernumber([]);
      return [];
    }
  }

  async function fetchHistoryLogs(area, cabinet, locker) {
    const resolvedArea = area || '';
    const resolvedCabinet = cabinet || '';
    const resolvedLocker = locker || '';
    const lockerId = normalizeLockerValue(resolvedLocker);

    setIsLoading(true);

    try {
      let response;

      if (resolvedArea && resolvedCabinet && lockerId) {
        response = await fetch(`${API_BASE_URL}/getHistoryLogsId/${resolvedArea}/${resolvedCabinet}/${lockerId}`);
      } else if (resolvedArea && resolvedCabinet) {
        response = await fetch(`${API_BASE_URL}/getHistoryLogsCabinet/${resolvedArea}/${resolvedCabinet}`);
      } else if (resolvedArea) {
        response = await fetch(`${API_BASE_URL}/getHistoryLogsArea/${resolvedArea}`);
      } else {
        response = await fetch(`${API_BASE_URL}/getHistoryLogs`);
      }

      if (!response.ok) {
        throw new Error('Unable to load history.');
      }

      const data = await response.json();
      const logs = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setHistoryLogs(logs);
      return logs;
    } catch (error) {
      console.error('Error fetching history logs:', error);
      setHistoryLogs([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchRequestType() {
    try {
      const response = await fetch(`${API_BASE_URL}/getRequestType`);
      if (!response.ok) {
        throw new Error('Unable to load requests.');
      }

      const data = await response.json();
      setNotificationCount(Array.isArray(data?.logs) ? data.logs.length : 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setNotificationCount(0);
    }
  }

  useEffect(() => {
    fetchAreas();
    fetchHistoryLogs('', '', '');
  }, []);

  useEffect(() => {
    if (!selectedArea) {
      setCabinetnumber([]);
      setLockernumber([]);
      return;
    }

    fetchCabinets(selectedArea);

    if (!selectedCabinet) {
      setLockernumber([]);
      return;
    }

    fetchLockers(selectedArea, selectedCabinet);
  }, [selectedArea, selectedCabinet]);

  useEffect(() => {
    fetchRequestType();
  }, []);

  const handleAreaChange = (event) => {
    const nextArea = event.target.value;
    setSelectedArea(nextArea);
    setSelectedCabinet('');
    setSelectedLocker('');
  };

  const handleCabinetChange = (event) => {
    const nextCabinet = event.target.value;
    setSelectedCabinet(nextCabinet);
    setSelectedLocker('');
  };

  const handleLockerChange = (event) => {
    setSelectedLocker(event.target.value);
  };

  const handleSubmitFilters = async () => {
    const nextArea = selectedArea || '';
    const nextCabinet = selectedCabinet || '';
    const nextLocker = selectedLocker || '';

    setAppliedArea(nextArea);
    setAppliedCabinet(nextCabinet);
    setAppliedLocker(nextLocker);

    await fetchHistoryLogs(nextArea, nextCabinet, nextLocker);
  };

  const handleResetFilters = async () => {
    setSelectedArea('');
    setSelectedCabinet('');
    setSelectedLocker('');

    setAppliedArea('');
    setAppliedCabinet('');
    setAppliedLocker('');

    await fetchHistoryLogs('', '', '');
  };

  const downloadCsv = () => {
    if (!filteredRecords.length) {
      return;
    }

    const headers = ['ID', 'Area', 'Locker Number', 'Cabinet Number', 'Name', 'Shift', 'Activity', 'Date Updated'];
    const rows = filteredRecords.map((record) => [
      record.id ?? '',
      record.area ?? '',
      record.lockernumber ?? '',
      record.cabinetnumber ?? '',
      record.name ?? '',
      record.shift ?? '',
      record.activity ?? '',
      record.dateupdate ?? '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute(
      'download',
      `locker-history-${selectedArea || 'all'}-${selectedCabinet || 'all'}-${selectedLocker || 'all'}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f6f8fb' }}>
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200 }}>
        <Toolbar userName="Admin" notificationCount={notificationCount} onLogout={() => {}} />
      </Box>

      <Container maxWidth="lg" sx={{ py: 4, mt: 10 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5, color: '#172033' }}>
              Locker Change History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and export recorded locker ownership changes.
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={downloadCsv}
            disabled={!filteredRecords.length}
            sx={{ borderRadius: 2, px: 3, py: 1.25, boxShadow: 'none', '&:hover': { boxShadow: 2 } }}
          >
            Download CSV
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            border: '1px solid #e5e9f0',
            borderRadius: 3,
            backgroundColor: '#fff',
            boxShadow: '0 4px 18px rgba(23, 32, 51, 0.04)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            <FormControl fullWidth>
              <InputLabel id="area-select-label">Area</InputLabel>
              <Select
                labelId="area-select-label"
                value={selectedArea}
                label="Area"
                onChange={handleAreaChange}
              >
                <MenuItem value="">All Areas</MenuItem>
                {areasName.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!selectedArea}>
              <InputLabel id="cabinet-select-label">Cabinet</InputLabel>
              <Select
                labelId="cabinet-select-label"
                value={selectedCabinet}
                label="Cabinet"
                onChange={handleCabinetChange}
              >
                <MenuItem value="">All Cabinets</MenuItem>
                {cabinetnumber.map((cabinet) => (
                  <MenuItem key={cabinet.cabinets} value={cabinet.cabinets}>
                    {cabinet.cabinets}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!selectedCabinet}>
              <InputLabel id="locker-select-label">Locker</InputLabel>
              <Select
                labelId="locker-select-label"
                value={selectedLocker}
                label="Locker"
                onChange={handleLockerChange}
              >
                <MenuItem value="">All Lockers</MenuItem>
                {lockernumber.map((locker) => {
                  const lockerValue = locker.lockers;
                  return (
                    <MenuItem key={lockerValue} value={lockerValue}>
                      {lockerValue}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: { xs: 0, sm: 'auto' } }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitFilters}
                disabled={!hasFilterSelected}
                sx={{ backgroundColor: 'black', borderRadius: 2, px: 3 }}
              >
                Submit
              </Button>

              <Button
                variant="outlined"
                onClick={handleResetFilters}
                sx={{
                  borderColor: '#000',
                  color: '#000',
                  borderRadius: 2,
                  px: 3,
                }}
              >
                Reset
              </Button>
            </Box>
          </Box>
        </Paper>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 3,
            overflow: 'auto',
            border: '1px solid #e5e9f0',
            boxShadow: '0 4px 18px rgba(23, 32, 51, 0.04)',
          }}
        >
          <Table sx={{ minWidth: 900 }}>
            <TableHead sx={{ backgroundColor: '#f2f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475467', whiteSpace: 'nowrap' }}>Area</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475467', whiteSpace: 'nowrap' }}>Locker Number</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475467', whiteSpace: 'nowrap' }}>Cabinet Number</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475467', whiteSpace: 'nowrap' }}>Current Owner</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475467', whiteSpace: 'nowrap' }}>Previous Owner</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475467' }}>Shift</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475467' }}>Activity</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475467', whiteSpace: 'nowrap' }}>Date Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <CircularProgress size={18} />
                      <Typography variant="body2">Loading history...</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow
                    hover
                    key={record.id || `${record.area}-${record.cabinetnumber}-${record.lockernumber}-${record.dateupdate}`}
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    <TableCell>{record.area ?? '-'}</TableCell>
                    <TableCell>{record.lockernumber ?? '-'}</TableCell>
                    <TableCell>{record.cabinetnumber ?? '-'}</TableCell>
                    <TableCell>{record.currentowner ?? '-'}</TableCell>
                    <TableCell>{record.prevowner ?? '-'}</TableCell>
                    <TableCell>{record.shift ?? '-'}</TableCell>
                    <TableCell>{record.activity ?? '-'}</TableCell>
                    <TableCell>
                      {(() => {
                        const date = new Date(record.dateupdate);
                        return !Number.isNaN(date.getTime()) ? date.toLocaleString() : '-';
                      })()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    No history available for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
}