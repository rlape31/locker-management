import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Button,
  TextField,
  Stack,
} from '@mui/material';
import Toolbar from '../components/toolbar';

export default function LockerDirectory() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [selectedArea, setSelectedArea] = useState('');
  const [areasName, setAreasName] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [filterTerm, setFilterTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({
    area: '',
    cabinetnumber: '',
    lockernumber: '',
    name: '',
    shift: '',
    statusnow: '',
  });

  useEffect(() => {
    async function fetchAreas() {
      try {
        const response = await fetch(`http://10.3.10.20:5001/getArealist`);
        const data = await response.json();
        setAreasName(data.areas.map(area => area.area));
        if (data.areas && data.areas.length > 0) {
          setSelectedArea(prev => prev || data.areas[0].area);
        }
      }
      catch (error) {
        console.error("Error fetching areas:", error);
      }
    }
    fetchAreas();
  }, []);

  useEffect(() => {
    if (!selectedArea) return;
    fetchLockers(selectedArea);
  }, [selectedArea]);

  async function fetchLockers(selectedArea) {
    if (!selectedArea) return [];
    try {
      const response = await fetch(`http://10.3.10.20:5001/getCabinetsDetails/${selectedArea}`);
      const data = await response.json();
      const lockersData = Array.isArray(data.data) ? data.data : [];
      setAreaData(lockersData);
      setFilterTerm('');
      setColumnFilters({
        area: '',
        cabinetnumber: '',
        lockernumber: '',
        name: '',
        shift: '',
        statusnow: '',
      });
    }
    catch (error) {
      console.error("Error fetching lockers:", error);
      return [];
    }
  }

  const filteredAreaData = areaData.filter((row) => {
    const globalTerm = filterTerm.trim().toLowerCase();
    const matchesGlobal = !globalTerm || [
      row.area,
      row.cabinetnumber,
      row.lockernumber,
      row.name,
      row.shift,
      row.statusnow,
    ].some((value) =>
      String(value ?? '').toLowerCase().includes(globalTerm)
    );

    const matchesColumns = Object.entries(columnFilters).every(([key, value]) => {
      const normalized = value.trim().toLowerCase();
      if (!normalized) return true;
      return String(row[key] ?? '').toLowerCase().includes(normalized);
    });

    return matchesGlobal && matchesColumns;
  });

  const filterColumns = [
    { key: 'area', placeholder: 'Filter Area' },
    { key: 'cabinetnumber', placeholder: 'Filter Cabinet' },
    { key: 'lockernumber', placeholder: 'Filter Locker' },
    { key: 'name', placeholder: 'Filter Name' },
    { key: 'shift', placeholder: 'Filter Shift' },
    { key: 'statusnow', placeholder: 'Filter Status' },
  ];

  function downloadCsv() {
    if (!filteredAreaData.length) return;
    const headers = ['Area', 'Cabinet Number', 'Locker Number', 'Employee Name', 'Shift', 'Status'];
    const csvRows = [
      headers.join(','),
      ...filteredAreaData.map((row) =>
        [row.area, row.cabinetnumber, row.lockernumber, row.name, row.shift, row.statusnow]
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedArea || 'locker-directory'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

   useEffect(() => {
        async function fetchRequestType() {
          try{
            const response = await fetch('http://10.3.10.20:5001/getRequestType');
            if (!response.ok) throw new Error('Unable to load requests.');
            const data = await response.json();
            // setRequestlist(Array.isArray(data.logs) ? data.logs : []);
            setNotificationCount(data.logs.length);
          } catch (error) {
            console.error('Error fetching request types:', error);
          } 
        }
        fetchRequestType();
      }, []);

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f5f7ff 0%, #eef3ff 100%)' }}>
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200 }}>
        <Toolbar userName="Admin" notificationCount={notificationCount} onLogout={() => {}} />
      </Box>

      <Container maxWidth="lg" sx={{ py: 4, mt: 10, pb: 6 }}>
        <Box
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: 'rgba(255,255,255,0.72)',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
          }}
        >
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.04em', color: 'text.primary', mb: 2 }}>
            Locker Directory
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1, minWidth: 260, maxWidth: 340 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="area-select-label">Select Area</InputLabel>
                <Select
                  labelId="area-select-label"
                  id="area-select"
                  value={selectedArea}
                  label="Select Area"
                  onChange={(event) => setSelectedArea(event.target.value)}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148, 163, 184, 0.6)' },
                  }}
                >
                  <MenuItem value="">-- Choose an area --</MenuItem>
                  {areasName.map((area) => (
                    <MenuItem key={area} value={area}>
                      {area}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="outlined"
                onClick={() => setFilterEnabled(prev => !prev)}
                disabled={!selectedArea}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 2,
                }}
              >
                {filterEnabled ? 'Hide Filter' : 'Filter'}
              </Button>
              <Button
                variant="contained"
                onClick={downloadCsv}
                disabled={!selectedArea || filteredAreaData.length === 0}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 2,
                  boxShadow: 'none',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)' },
                }}
              >
                Download
              </Button>
            </Stack>
          </Box>

          {filterEnabled && selectedArea && (
            <Box sx={{ maxWidth: 420 }}>
              <TextField
                fullWidth
                label="Search directory"
                value={filterTerm}
                onChange={(event) => setFilterTerm(event.target.value)}
                placeholder="Search by area, locker, name, shift, status"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#fff',
                  },
                }}
              />
            </Box>
          )}
        </Box>

        {selectedArea ? (
          <>
            <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
              {selectedArea} Directory
            </Typography>

            <TableContainer
              component={Paper}
              sx={{
                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid rgba(148, 163, 184, 0.2)',
              }}
            >
              <Table size="medium" stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#eef2ff' }}>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>Area</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>Cabinet Number</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>Locker Number</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>Employee Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>Shift</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5 }}>Status</TableCell>
                  </TableRow>
                  {filterEnabled && (
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      {filterColumns.map((column) => (
                        <TableCell key={column.key} sx={{ py: 1.25 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={columnFilters[column.key]}
                            onChange={(event) =>
                              setColumnFilters((prev) => ({
                                ...prev,
                                [column.key]: event.target.value,
                              }))
                            }
                            placeholder={column.placeholder}
                            inputProps={{ 'aria-label': column.placeholder }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: '#fff',
                              },
                            }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </TableHead>
                <TableBody>
                  {filteredAreaData.length > 0 ? (
                    filteredAreaData.map((row, index) => (
                      <TableRow
                        key={index}
                        hover
                        sx={{
                          backgroundColor: index % 2 === 0 ? '#f8fafc' : '#ffffff',
                          '&:hover': { backgroundColor: '#eef6ff' },
                        }}
                      >
                        <TableCell sx={{ py: 1.5 }}>{row.area}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>{row.cabinetnumber}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>{row.lockernumber}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>{row.name}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>{row.shift}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>{row.statusnow}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary', fontStyle: 'italic' }}>
                        No directory entries found for this area.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Box sx={{ p: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.75)', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <Typography color="text.secondary">
              Please select an area to view the locker directory.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
