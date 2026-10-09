import { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Chip, CircularProgress, Dialog, DialogTitle, TextField } from '@mui/material';
import RateReviewIcon from '@mui/icons-material/RateReview';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Toolbar from '../components/toolbar';

const formDefinitions = {
  newEmployee: 'New Employee Request',
  transferArea: 'Transfer Area Request',
  changeLocker: 'Change Locker Position',
  tempLocker: 'Temporary Locker Request',
  clearanceLocker: 'Clearance Locker Request',
};

const requestTypeLegend = Object.entries(formDefinitions).map(([key, title]) => ({
  key,
  title,
}));

const normalizeRequestType = (value) => String(value || '')
  .replace(/request$/i, '')
  .replace(/[^a-zA-Z0-9]/g, '')
  .toLowerCase();

const getFormDefinition = (requestType) => requestTypeLegend.find(({ key, title }) => (
  normalizeRequestType(key) === normalizeRequestType(requestType)
  || normalizeRequestType(title) === normalizeRequestType(requestType)
));

const getRequestTypeKey = (requestType) => {
  const normalized = normalizeRequestType(requestType);
  return requestTypeLegend.find(({ key }) => normalizeRequestType(key) === normalized)?.key || normalized;
};

export default function ApprovalRequest() {
  const [adminName, setAdminname ] = useState('Admin');
  const [showReview, setShowReview] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [approved, setApproved] = useState(false);
  const [assignMessage, setAssignMessage] = useState({ open: false, severity: 'info', text: '' });
  const [requestlogs, setRequestlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [arealist, setArealist] = useState([]);
  const [cabinetlist, setCabinetlist] = useState([]);
  const [requestlist, setRequestlist] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedCabinet, setSelectedCabinet] = useState('');
  const [selectedLocker, setSelectedLocker] = useState('');
  const [lockernumber, setLockernumber] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [requestedCabinet, setRequestedCabinet] = useState('');
  const [requestedLocker, setRequestedLocker] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [requestid, setRequestid] = useState('');
  const [showAssignBox, setShowAssignBox] = useState(false);
  const getRequestUuid = (item) => item?.uuid ?? null;
  const requestType = getRequestTypeKey(selectedRequest?.requesttype);
  const isChangeLocker = requestType === 'changeLocker';
  const isTempLocker = requestType === 'tempLocker';
  const requiresArea = requestType === 'newEmployee' || requestType === 'transferArea' || requestType === 'tempLocker';
  const requiresCabinetAndLocker = requiresArea || isChangeLocker;
  const hasAvailableLocker = !isTempLocker || lockernumber.length > 0;
  const canAssign = !isChangeLocker || approved;
  const [responseMessage, setResponseMessage] = useState('');
  const [openApprovalDialog, setOpenApprovalDialog] = useState(false);
  const [prevCabinet, setPrevCabinet] = useState('');
  const [prevLocker, setPrevLocker] = useState(''); 

  const handleAssign = async () => {
    if (!selectedLocker || !selectedCabinet || (requiresArea && !selectedArea)) {
      setAssignMessage({ open: true, severity: 'warning', text: 'Selected field incomplete.' });
      return;
    }

    if (isTempLocker && !hasAvailableLocker) {
      setAssignMessage({ open: true, severity: 'warning', text: 'No available lockers found.' });
      return;
    }

    await handleAssignLocker();
    // setOpenDialog(true);
  };

  const handleAssignRequest = async () => {
    if (!selectedLocker || !selectedCabinet || (requiresArea && !selectedArea)) {
      setAssignMessage({ open: true, severity: 'warning', text: 'Selected field incomplete.' });
      return;
    }

    if (isTempLocker && !hasAvailableLocker) {
      setAssignMessage({ open: true, severity: 'warning', text: 'No available lockers found.' });
      return;
    }

    await handleAssignRequestLocker();
    // setOpenDialog(true);
  };


  const handleReject = async () => {
    try {
      const response = await fetch('http://10.3.10.20:5001/respondRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestid: requestid,
          uuid: selectedRequest.uuid,
          currentstatus: 'Rejected',
         // requestor_email: selectedRequest.requestoremail,
          //message: 'Your locker request has been rejected.',
        }),
      });
      const result = await response.json();
      if (result.status === 'success') {
      setApproved(false);
      setOpenDialog(true);
      setAssignMessage({ open: true, severity: 'info', text: result.message});
      await fetchRequestType();
      } else {
        setAssignMessage({ open: true, severity: 'error', text: result.message || 'Failed to reject request.' });
      }
    } catch (error) {
      setAssignMessage({ open: true, severity: 'error', text: error.message || 'Unable to notify requestor.' });
    }
  };

  async function fetchRequestType() {
    try {
      setLoading(true);
      setLoadError('');
      const response = await fetch('http://10.3.10.20:5001/getRequestType');
      const data = await response.json();
      setRequestlist(Array.isArray(data.logs) ? data.logs : []);
      setNotificationCount(Array.isArray(data.logs) ? data.logs.length : 0);
    } catch (error) {
      setLoadError('No request.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignLocker() {
    try {
      const response = await fetch('http://10.3.10.20:5001/assignLocker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          employee_name: selectedRequest.employeeName,
          area: selectedArea,
          cabinet: requestedCabinet,
          locker: requestedLocker,
          requestid: requestid,
          uuid: selectedRequest.uuid,
          prevarea : requestlogs[0]?.area,
          prevcabinet : requestlogs[0]?.currentCabinet,
          prevlocker : requestlogs[0]?.currentlocker,
          formType : requestlogs[0]?.requesttype
        }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        setAssignedTo(selectedRequest.employeename);
        setAssignMessage({ open: true, severity: 'success', text: result.message || 'Locker assigned successfully.' });
        setApproved(true);
        setOpenDialog(true);
        await fetchRequestType();
      } else {
        setAssignMessage({ open: true, severity: 'error', text: result.message || 'Failed to assign locker.' });
      }
    } catch (error) {
      console.log(error);
      setAssignMessage({ open: true, severity: 'error', text: error.message || 'Failed to assign locker.' });
    }
  }

  console.log(selectedRequest.currentlocker)

  async function handleAssignRequestLocker() {
    try {
      const response = await fetch('http://10.3.10.20:5001/assignLocker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: selectedRequest.employeeid,
          employee_name: selectedRequest.employeename,
          area: selectedArea,
          cabinet: selectedCabinet,
          locker: selectedLocker,
          requestid: requestid,
          uuid: selectedRequest.uuid,
          prevarea : requestlogs[0]?.currentarea,
          prevcabinet : requestlogs[0]?.currentCabinet,
          prevlocker : requestlogs[0]?.currentlocker,
          formType : requestlogs[0]?.requesttype
        }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        setAssignedTo(selectedRequest.employeename);
        setAssignMessage({ open: true, severity: 'success', text: result.message || 'Locker assigned successfully.' });
        setApproved(true);
        setOpenDialog(true);
        await fetchRequestType();
      } else {
        setAssignMessage({ open: true, severity: 'error', text: result.message || 'Failed to assign locker.' });
      }
    } catch (error) {
      console.log(error);
      setAssignMessage({ open: true, severity: 'error', text: error.message || 'Failed to assign locker.' });
    }
  }

  console.log(requestedCabinet);
  console.log(requestid);
  console.log(selectedRequest.uuid);
  console.log(selectedRequest.employeename)
  

  async function handleApproval() {
    try {
      const response = await fetch('http://10.3.10.20:5001/approverequest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body:JSON.stringify({
          requestid: requestid,
          employee_id: selectedRequest.employeeid,
          uuid: selectedRequest.uuid,
          approver: adminName
        }),
      });
      const result = await response.json();
      if(result.status === "success"){
        setResponseMessage(result.message)
        setOpenApprovalDialog(true)
      }else{
        setResponseMessage('Not approved.')
      }
    } catch(error){
      setLoadError(error.message || 'Unable to approved.');
      return false;
    }
  }

  async function fetchRequestLogs(uuid) {
    if (!uuid) return false;
    try {
      const response = await fetch(`http://10.3.10.20:5001/getRequestlogs/${uuid}`);
      const data = await response.json();
      setRequestlogs(Array.isArray(data.logs) ? data.logs : []);
      return true;
    } catch (error) {
      setLoadError(error.message || 'Unable to load requests.');
      return false;
    }
  }

  console.log(selectedRequest.requesttype);
  console.log(adminName)

  useEffect(() => {
    async function fetchrequestType() {
      try {
        setLoading(true);
        setLoadError('');
        const response = await fetch('http://10.3.10.20:5001/getRequestType');
        if (!response.ok) throw new Error('Unable to load requests.');
        const data = await response.json();
        setRequestlist(Array.isArray(data.logs) ? data.logs : []);
        setNotificationCount(Array.isArray(data.logs) ? data.logs.length : 0);
      } catch (error) {
        setLoadError(error.message || 'Unable to load requests.');
      } finally {
        setLoading(false);
      }
    }
    fetchrequestType();
  }, []);

  const selectedLogs = selectedRequest ? requestlogs : [];

  console.log(requestlogs)
      
  useEffect(() => {
      async function fetchAreas() {
        try {
          const response = await fetch('http://10.3.10.20:5001/getArealist');
          const data = await response.json();
          const areaList = Array.isArray(data.areas) ? data.areas.map((area) => area.area) : [];
          setArealist(areaList);
        } catch (error) {
          console.error('Error fetching areas:', error);
        }
      }
  
      fetchAreas();
    }, []);

    const handleReviewButton = async (item) => {
      const uuid = getRequestUuid(item);
      const selectedUuid = getRequestUuid(selectedRequest);

      if (showReview && selectedUuid != null && String(selectedUuid) === String(uuid)) {
        setShowReview(false);
        return;
      }

      setSelectedRequest(item);
      setApproved(false);
      setShowAssignBox(false);
      setSelectedArea(item.area || item.currentarea || '');
      setSelectedCabinet('');
      setSelectedLocker('');
      setRequestlogs([]);

      const logsLoaded = await fetchRequestLogs(uuid);
      if (logsLoaded) setShowReview(true);
    };

  useEffect(() => {
    if (!selectedArea) {
        setCabinetlist([]);
        //setLockerlist([]);
        return;
      }
  
      fetchCabinets(selectedArea);
  
      if (!selectedCabinet) {
        setLockernumber([]);
      }
  
      fetchLockers(selectedArea, selectedCabinet);
    }, [selectedArea, selectedCabinet]);
    

    async function fetchCabinets(area) {
    if (!area) return [];
    try {
      const response = await fetch(`http://10.3.10.20:5001/getCabinetsList/${area}`);
      const data = await response.json();
      const cabinetnumbers = Array.isArray(data.cabinets) ? data.cabinets : [];
      setCabinetlist(cabinetnumbers);
      return cabinetnumbers;
    } catch (error) {
      console.error('Error fetching cabinets:', error);
      return [];
    }
  }

  async function fetchLockers(area, cabinet) {
    if (!area || !cabinet) return [];
    try {
      const response = await fetch(`http://10.3.10.20:5001/getLockerList/${area}/${cabinet}`);
      const data = await response.json();
      const lockernumbers = Array.isArray(data.lockerlist) ? data.lockerlist : [];
      setLockernumber(lockernumbers);
      return lockernumbers;
    } catch (error) {
      console.error('Error fetching lockers:', error);
      return [];
    }
  }

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

  const handleApprove = () => {
    if (isChangeLocker && requestlogs.length > 0) {
      const latestLog = requestlogs[requestlogs.length - 1];
      const requestedCabinet = latestLog.requestedcabinet;
      const requestedLocker = latestLog.requestedlocker;

      setRequestedCabinet(requestedCabinet);
      setRequestedLocker(requestedLocker);
      setSelectedCabinet(requestedCabinet);
      setSelectedLocker(requestedLocker);
      setSelectedArea(latestLog.currentarea);
      setEmployeeId(latestLog.employeeid);
      setEmployeeName(latestLog.employeename);
      setRequestid(latestLog.id);
      // setPrevCabinet(latestLog.currentCabinet);
      // setPrevLocker(latestLog.lockernumber)
    }
    setApproved(true);
    setShowAssignBox((isVisible) => !isVisible);
  };

    console.log(selectedCabinet)
    console.log(selectedArea)
    console.log(employeeId)
    console.log(employeeName)
    console.log(requestlogs)
    console.log(selectedRequest.uuid)
    console.log(requestlogs[0]?.currentarea)
    console.log(requestlogs[0]?.currentCabinet)
    console.log(requestlogs[0]?.currentlocker)
    

  const AssignBox = () => (
    <Box sx={{ display: 'flex', gap: 2, mt: 3, p: 2, alignItems: 'center', flexWrap: 'wrap', border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap' }}>
        Assign in:
      </Typography>
      {selectedRequest?.requesttype === 'tempLocker' && (
        <Typography variant="body2" sx={{ flexBasis: '100%', color: 'text.secondary' }}>
          Please review the locker count request. If the requested quantity is more than one, kindly assign the locker manually via the Dashboard Map. Thank you.
        </Typography>
      )}
      {requiresArea && (
        <FormControl fullWidth sx={{ minWidth: 220, flex: 1 }}>
          <InputLabel id="area-select-label">Available Area</InputLabel>
          <Select
            labelId="area-select-label"
            id="area-select"
            value={selectedArea}
            label="Area"
            onChange={handleAreaChange}
            >
              {arealist.map((area) => (
            <MenuItem key={area} value={area}>
              {area}
            </MenuItem>
              ))}
          </Select>
        </FormControl>
          )}
        <FormControl fullWidth disabled={!selectedArea} sx={{ minWidth: 220, flex: 1 }}>
          <InputLabel id="area-select-label">Available Cabinet</InputLabel>
          <Select
            labelId="cabinet-select-label"
            id="cabinet-select"
            value={selectedCabinet}
            label="Cabinet"
            onChange={handleCabinetChange}
          >
              <MenuItem value="">Select Cabinet</MenuItem>
              {cabinetlist.map((cabinet) => (
              <MenuItem key={cabinet.cabinets} value={cabinet.cabinets}>
                {cabinet.cabinets}
              </MenuItem>
              ))}
          </Select>
              </FormControl>
              <FormControl fullWidth disabled={!selectedCabinet} sx={{ minWidth: 220, flex: 1 }} >
               <InputLabel id="locker-select-label">Available Locker</InputLabel>
                  <Select
                    labelId="locker-select-label"
                    value={selectedLocker}
                    label="Locker"
                    onChange={handleLockerChange}
                    >
                    <MenuItem value="">Select Locker</MenuItem>
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

              <Button
                variant="contained"
                disabled={isTempLocker && !hasAvailableLocker}
                onClick={handleAssignRequest}
        >
        Assign
      </Button>
    </Box>
  )
  console.log(selectedRequest.RequestType)

 const AssignBoxinChangeLocker = () => (
    <Box sx={{ display: 'flex', gap: 2, mt: 3, p: 2, alignItems: 'center', flexWrap: 'wrap', border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap' }}>
        Assign in:
      </Typography>
      {requiresArea && (
        <FormControl fullWidth sx={{ minWidth: 220, flex: 1 }}>
          {/* <InputLabel id="area-select-label">Available Area</InputLabel> */}
          <TextField
            labelId="area-select-label"
            id="area-select"
            value={selectedArea}
            label="Area"
            InputProps={{ readOnly: true }}
          />
        </FormControl>
          )}
        <FormControl fullWidth sx={{ minWidth: 220, flex: 1 }}>
          {/* <InputLabel id="area-select-label">Available Cabinet</InputLabel> */}
          <TextField
            labelId="cabinet-select-label"
            id="cabinet-select"
            value={requestedCabinet}
            label="Requested Cabinet"
            InputProps={{ readOnly: true }}
          />
        </FormControl>
        <FormControl fullWidth disabled={!requestedCabinet} sx={{ minWidth: 220, flex: 1 }} >
               {/* <InputLabel id="locker-select-label">Available Locker</InputLabel> */}
          <TextField
            labelId="locker-select-label"
            value={requestedLocker}
            label="Requested Locker"
            InputProps={{ readOnly: true }}
          />
        </FormControl>
              <Button
                variant="contained"
                disabled={isTempLocker && !hasAvailableLocker}
                onClick={handleAssign}
        >
        Assign
      </Button>
    </Box>
  )

  const handleApproveDialog = () => {
    handleApproval()
  }

  const handleOkayDialog = () => {
    setApproved(false);
    setOpenDialog(false);
    setOpenApprovalDialog(false)
    setShowAssignBox(false);
    setSelectedArea('');
    setSelectedCabinet('');
    setSelectedLocker('');
    fetchRequestType();
  }

  return (
    <Box>
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200 }}>
        <Toolbar userName="Admin" requestCount={0} notificationCount={notificationCount} />
      </Box>
      {/* <Toolbar /> */}
      <Box sx={{ maxWidth: 2000, mx: 'auto', mt: { xs: 8, md: 10 }, px: { xs: 1, sm: 2 }, fontFamily: 'Arial, sans-serif' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Review and Approval
            </Typography>
            <Typography color="text.secondary">Review, assign, and approve locker requests.</Typography>
          </Box>
          <Chip label={`${requestlogs.length} total`} color="primary" variant="outlined" />
        </Box>

        {loading && (
          <Paper sx={{ p: 5, textAlign: 'center', mb: 3 }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary" sx={{ mt: 2 }}>Loading requests...</Typography>
          </Paper>
        )}

      {!loading ? (
          <TableContainer component={Paper} elevation={2} sx={{ mb: 3, borderRadius: 2, overflow: 'auto' }}>
            <Typography variant="h6" sx={{ p: 2, backgroundColor: '#eef2ff', fontWeight: 700, color: "darkblue" }}>Requests</Typography>
            <Table size="small" sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell key="request-type" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Request Type</TableCell>
                  <TableCell key="employee-id" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Employee Id</TableCell>
                  <TableCell key="employee-name" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Employee Name</TableCell>
                  <TableCell key="requestor-name" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Requestor Name</TableCell>
                  <TableCell key="requestor-email" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Requestor Email</TableCell>
                  <TableCell key="submitted-date" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Submitted Date</TableCell>
                  <TableCell key="current-status" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Currrent Status</TableCell>
                  <TableCell key="actions" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requestlist.map((item, index) => {
                  const rowKey = item?.uuid ?? item?.requestid ?? `request-row-${index}`;
                  return (
                    <TableRow key={rowKey}>
                      <TableCell>{item.requesttype}</TableCell>
                      <TableCell>{item.employeeid}</TableCell>
                      <TableCell>{item.employeename}</TableCell>
                      <TableCell>{item.requestorname}</TableCell>
                      <TableCell>{item.requestoremail}</TableCell>
                      <TableCell>{(() => { const date = new Date(item.submitteddate); return !Number.isNaN(date.getTime()) ? date.toLocaleString() : '-'; })()}</TableCell>
                      <TableCell>{item.currentstatus}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          startIcon={<RateReviewIcon />}
                          onClick={() => handleReviewButton(item)}
                        >
                          {showReview && String(getRequestUuid(selectedRequest)) === String(getRequestUuid(item)) ? 'Hide Review' : 'Review'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!requestlist.length && <TableRow><TableCell colSpan={8}>No requests found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}

      {showReview && (
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{fontWeight: 'bold'}}>
            Review Details
          </Typography>
          {selectedRequest && getFormDefinition(selectedRequest.requesttype) && (         
              <Typography
                component="legend"
                variant="subtitle1"
                sx={{ px: 1, color: '#1c75db', fontWeight: "bold"}}
              >Request Type: {getFormDefinition(selectedRequest.requesttype).title}
              </Typography>
          )}
          <Table>
            <TableBody>
              {selectedRequest && (() => {
                const item = selectedRequest;
                const selectedLogs = requestlogs;
                return (
                  <>
                  {!selectedLogs.length && (
                    <TableRow>
                      <TableCell colSpan={2}>
                        No request logs found for this request.
                      </TableCell>
                    </TableRow>
                  )}
                  {selectedLogs.map((request, logIndex) => {
                    const values = Object.entries(request).filter(([, value]) => (
                      value !== null && value !== undefined && value !== ''
                    ));

                    return (
                      <TableRow key={`${getRequestUuid(item)}-log-${logIndex}`}>
                        <TableCell sx={{ py: 2 }}>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
                            {values.map(([key, value]) => {
                              const displayValue = /date|time|updated|created/i.test(key)
                                && !Number.isNaN(new Date(value).getTime())
                                ? new Date(value).toLocaleString()
                                : typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : value;

                              return (
                                <Box key={key}>
                                  <Typography
                                    variant="h6"
                                    sx={{ display: 'block', color: 'black', textTransform: 'uppercase', letterSpacing: 0., fontWeight: 'bold' }}
                                  >
                                    {key.charAt(0).toLowerCase() + key.slice(1)}
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 700, wordBreak: 'break-word', color: '#ac481a'}}>
                                    {displayValue}
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  </>
                );
              })()}
            </TableBody>
          </Table>

          {isChangeLocker ? (
            <>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleApprove}
                >
                  Approve Request
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleReject}
                >
                  Reject
                </Button>
              </Box>
            </>
          ) : (<AssignBox />)}

          <Snackbar open={assignMessage.open} autoHideDuration={3000} onClose={() => setAssignMessage((s) => ({ ...s, open: false }))}>
            <Alert severity={assignMessage.severity} sx={{ width: '100%' }}>
              {assignMessage.text}
            </Alert>
          </Snackbar>
        </Paper>
      )}

      {selectedLogs.length > 0 && requiresCabinetAndLocker && canAssign && showAssignBox && (
        isChangeLocker ? <AssignBoxinChangeLocker /> : <AssignBox />
      )}
      {approved && (
        <Dialog
          open={openDialog}
          onClose={() => {
            setApproved(false);
            setOpenDialog(false);
            setShowAssignBox(false);
            setSelectedArea('');
            setSelectedCabinet('');
            setSelectedLocker('');
          }}
          PaperProps={{
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
              minWidth: { xs: 300, sm: 420 },
              border: '1px solid #b7e7c8',
              boxShadow: '0 18px 45px rgba(34, 197, 94, 0.16)',
            },
          }}
        >
          <DialogTitle sx={{
            px: 3,
            py: 2,
            background: 'linear-gradient(135deg, #e8f9ee 0%, #dff7e8 100%)',
            borderBottom: '1px solid #cfeed8',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#2e7d32',
              color: '#fff',
            }}>
              <CheckCircleIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1b5e20' }}>
              Assign Successful
            </Typography>
          </DialogTitle>

          <Paper elevation={0} sx={{
            p: 3,
            bgcolor: '#f4fff6',
            borderRadius: 0,
          }}>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: '#ffffff',
                border: '1px solid #dfeee2',
              }}>
                <Typography sx={{ color: '#5f6f63', fontWeight: 600 }}>
                  Assigned to:
                </Typography>
                <Typography sx={{ color: '#1b5e20', fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}>
                  {assignedTo}
                </Typography>
              </Box>

              <Box sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#ebfff0',
                border: '1px solid #ccefd3',
              }}>
                <Typography sx={{ color: '#1e3a2d', lineHeight: 1.6 }}>
                  {assignMessage?.text}
                </Typography>
              </Box>
              <Button variant="contained" color="primary" onClick={handleApproveDialog} sx={{ alignSelf: 'flex-end', mt: 1 }}>
                Approve Request
              </Button>
            </Box>
          </Paper>
        </Dialog>
      )}

    <Dialog
          open={openApprovalDialog}
          onClose={() => {
            setApproved(false);
            setOpenApprovalDialog(false);
            setShowAssignBox(false);
            setSelectedArea('');
            setSelectedCabinet('');
            setSelectedLocker('');
          }}
          PaperProps={{
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
              minWidth: { xs: 300, sm: 420 },
              border: '1px solid #b7e7c8',
              boxShadow: '0 18px 45px rgba(34, 197, 94, 0.16)',
            },
          }}
        >
          <DialogTitle sx={{
            px: 3,
            py: 2,
            background: 'linear-gradient(135deg, #e8f9ee 0%, #dff7e8 100%)',
            borderBottom: '1px solid #cfeed8',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#2e7d32',
              color: '#fff',
            }}>
              <CheckCircleIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1b5e20' }}>
              Approve Successful
            </Typography>
          </DialogTitle>

          <Paper elevation={0} sx={{
            p: 3,
            bgcolor: '#f4fff6',
            borderRadius: 0,
          }}>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {/* <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: '#ffffff',
                border: '1px solid #dfeee2',
              }}>
                <Typography sx={{ color: '#5f6f63', fontWeight: 600 }}>
                  Assigned to:
                </Typography>
                <Typography sx={{ color: '#1b5e20', fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}>
                  {assignedTo}
                </Typography>
              </Box> */}

              <Box sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#ebfff0',
                border: '1px solid #ccefd3',
              }}>
                <Typography sx={{ color: '#1e3a2d', lineHeight: 1.6 }}>
                  {responseMessage}
                </Typography>
              </Box>
              <Button variant="contained" color="primary" onClick={handleOkayDialog} sx={{ alignSelf: 'flex-end', mt: 1 }}>
                Okay
              </Button>
            </Box>
          </Paper>
        </Dialog>
    </Box>
    </Box>
  );
}
