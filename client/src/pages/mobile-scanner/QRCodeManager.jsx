// components/QRCodeManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  alpha,
  useTheme,
  Fade,
  Zoom,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import HotelIcon from '@mui/icons-material/Hotel';
import CodeIcon from '@mui/icons-material/Code';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';

const QRCodeManager = () => {
  const [qrCodes, setQrCodes] = useState([]);
  const [predefinedHotels, setPredefinedHotels] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatingSingle, setGeneratingSingle] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hotelDialogOpen, setHotelDialogOpen] = useState(false);
  const [qrToDelete, setQrToDelete] = useState(null);
  const [newHotel, setNewHotel] = useState({ code: '', name: '' });
  const [editingHotel, setEditingHotel] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState('add');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const theme = useTheme();

  // Professional color scheme
  const colorScheme = {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    error: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    info: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  };

  useEffect(() => {
    fetchQRCodes();
    fetchPredefinedHotels();
  }, []);

  const fetchQRCodes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/qr-codes/list');
      if (response.data.success) {
        setQrCodes(response.data.qrCodes);
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      setMessage('❌ Error fetching QR codes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPredefinedHotels = async () => {
    try {
      const response = await axios.get('/api/qr-codes/predefined-hotels');
      if (response.data.success) {
        setPredefinedHotels(response.data.predefinedHotels);
      }
    } catch (error) {
      console.error('Error fetching predefined hotels:', error);
    }
  };

  const generateAllQRCodes = async () => {
    setGenerating(true);
    try {
      const response = await axios.get('/api/qr-codes/generate-all');
      if (response.data.success) {
        setMessage(`✅ Generated ${response.data.qrCodes.length} QR codes successfully`);
        fetchQRCodes();
      }
    } catch (error) {
      setMessage('❌ Error generating QR codes: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateSingleQRCode = async (hotel) => {
    setGeneratingSingle(hotel.code);
    try {
      const response = await axios.post('/api/qr-codes/generate', {
        hotelCode: hotel.code,
        hotelName: hotel.name
      });
      
      if (response.data.success) {
        setMessage(`✅ QR code for ${hotel.name} generated successfully`);
        fetchQRCodes();
      }
    } catch (error) {
      console.error('Error generating single QR code:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setMessage(`❌ ${errorMessage}`);
      
      if (error.response?.data?.validCodes) {
        setMessage(`❌ ${errorMessage}. Valid codes: ${error.response.data.validCodes.join(', ')}`);
      }
    } finally {
      setGeneratingSingle(null);
    }
  };

  const deleteQRCode = async (fileName, hotelCode) => {
    setDeleting(fileName);
    try {
      const response = await axios.delete(`/api/qr-codes/delete/${fileName}`);
      if (response.data.success) {
        setMessage(`🗑️ QR code for ${hotelCode} deleted successfully`);
        setQrCodes(prev => prev.filter(qr => qr.fileName !== fileName));
        setDeleteDialogOpen(false);
        setQrToDelete(null);
        fetchPredefinedHotels();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setMessage(`❌ Error deleting QR code: ${errorMessage}`);
    } finally {
      setDeleting(null);
    }
  };

  const downloadQRCode = async (filename, hotelCode) => {
    try {
      const link = document.createElement('a');
      link.href = `/api/qr-codes/download/${filename}`;
      link.setAttribute('download', `hotel-qr-${hotelCode}.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setMessage(`📥 Downloading QR code for ${hotelCode}`);
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setMessage(`❌ Error downloading QR code: ${errorMessage}`);
    }
  };

  const testQRUrl = (hotelCode) => {
    const url = `${window.location.origin}/userform?hotelCode=${hotelCode}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage('📋 URL copied to clipboard');
  };

  const addHotel = async (hotelData) => {
    try {
      const response = await axios.post('/api/qr-codes/hotels', hotelData);
      if (response.data.success) {
        setMessage(`✅ Hotel "${hotelData.name}" added successfully`);
        fetchPredefinedHotels();
        return true;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setMessage(`❌ Error adding hotel: ${errorMessage}`);
      return false;
    }
  };

  const updateHotel = async (hotelCode, hotelData) => {
    try {
      const response = await axios.put(`/api/qr-codes/hotels/${hotelCode}`, hotelData);
      if (response.data.success) {
        setMessage(`✅ Hotel "${hotelData.name}" updated successfully`);
        fetchPredefinedHotels();
        return true;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setMessage(`❌ Error updating hotel: ${errorMessage}`);
      return false;
    }
  };

  const deleteHotel = async (hotelCode) => {
    try {
      const response = await axios.delete(`/api/qr-codes/hotels/${hotelCode}`);
      if (response.data.success) {
        setMessage(`🗑️ Hotel deleted successfully`);
        fetchPredefinedHotels();
        fetchQRCodes();
        return true;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setMessage(`❌ Error deleting hotel: ${errorMessage}`);
      return false;
    }
  };

  const handleSaveHotel = async () => {
    if (!newHotel.code.trim() || !newHotel.name.trim()) {
      setMessage('❌ Hotel code and name are required');
      return;
    }

    // if (!/^[a-z0-9-]+$/.test(newHotel.code.trim())) {
    //   setMessage('❌ Hotel code can only contain lowercase letters, numbers, and hyphens');
    //   return;
    // }

    if (actionType === 'add') {
      await addHotel({
        code: newHotel.code.trim(),
        name: newHotel.name.trim()
      });
    } else if (actionType === 'edit' && editingHotel) {
      await updateHotel(editingHotel.code, {
        name: newHotel.name.trim()
      });
    }

    setHotelDialogOpen(false);
    setNewHotel({ code: '', name: '' });
    setEditingHotel(null);
  };

  const openAddHotelDialog = () => {
    setActionType('add');
    setNewHotel({ code: '', name: '' });
    setEditingHotel(null);
    setHotelDialogOpen(true);
  };

  const openEditHotelDialog = (hotel) => {
    setActionType('edit');
    setNewHotel({ code: hotel.code, name: hotel.name });
    setEditingHotel(hotel);
    setHotelDialogOpen(true);
  };

  const openDeleteHotelDialog = (hotel) => {
    setQrToDelete({ ...hotel, type: 'hotel' });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (qrToDelete.type === 'hotel') {
      await deleteHotel(qrToDelete.code);
    } else {
      await deleteQRCode(qrToDelete.fileName, qrToDelete.hotelCode);
    }
    setDeleteDialogOpen(false);
    setQrToDelete(null);
  };

  const getFullUrl = (hotelCode) => {
    return `${window.location.origin}/userform?hotelCode=${hotelCode}`;
  };

  const openDeleteDialog = (qr) => {
    setQrToDelete({ ...qr, type: 'qr' });
    setDeleteDialogOpen(true);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter hotels based on search term
  const filteredHotels = predefinedHotels.filter(hotel =>
    hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedHotels = filteredHotels.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ 
      p: 3, 
      maxWidth: 1400, 
      margin: '0 auto',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Fade in timeout={800}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            mb: 4, 
            background: colorScheme.primary,
            color: 'white',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
              borderRadius: '50%',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Box sx={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 2,
                p: 1.5,
                mr: 3,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <QrCode2Icon sx={{ fontSize: 36, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="700" sx={{ 
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  mb: 1,
                  fontSize: { xs: '1.75rem', md: '2.125rem' }
                }}>
                  QR Code Management
                </Typography>
                <Typography variant="body1" sx={{ 
                  opacity: 0.9,
                  fontSize: '1.1rem'
                }}>
                  Professional QR code management system for hotel registration
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={`${qrCodes.length} Generated`} 
                variant="filled"
                size="medium"
                sx={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  height: 32
                }}
              />
              <Tooltip title="Refresh list">
                <IconButton 
                  onClick={fetchQRCodes} 
                  disabled={loading}
                  sx={{ 
                    background: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': { 
                      background: 'rgba(255,255,255,0.25)',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {message && (
        <Zoom in timeout={300}>
          <Alert 
            severity={message.includes('❌') ? 'error' : 'success'} 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid',
              borderColor: message.includes('❌') ? 'error.light' : 'success.light',
              fontSize: '0.9rem'
            }}
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        </Zoom>
      )}

      {/* Quick Actions */}
      <Fade in timeout={1000}>
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, background: 'white', border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: 'text.primary', fontSize: '1.1rem' }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={generating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
              onClick={generateAllQRCodes}
              disabled={generating}
              size="large"
              sx={{
                background: colorScheme.primary,
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease',
                minWidth: 180
              }}
            >
              {generating ? 'Generating...' : 'Generate All'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={openAddHotelDialog}
              size="large"
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontWeight: '600',
                borderWidth: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-1px)',
                  background: 'rgba(102, 126, 234, 0.04)'
                },
                transition: 'all 0.2s ease',
                minWidth: 150
              }}
            >
              Add Hotel
            </Button>

            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Chip 
                icon={<HotelIcon />}
                label={`${predefinedHotels.length} Hotels`}
                variant="outlined"
                sx={{ fontWeight: '500' }}
              />
              <Chip 
                icon={<QrCode2Icon />}
                label={`${qrCodes.length} QR Codes`}
                variant="outlined"
                sx={{ fontWeight: '500' }}
              />
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* Hotels Table Section */}
      <Fade in timeout={1200}>
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, background: 'white', border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: 'text.primary', fontSize: '1.1rem' }}>
              Hotel Management
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                size="small"
                placeholder="Search hotels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
                sx={{ 
                  width: 250,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <Chip 
                label={`${filteredHotels.length} Hotels`} 
                size="small" 
                color="primary"
                variant="outlined"
                sx={{ fontWeight: '500' }}
              />
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <TableContainer>
  <Table>
    <TableHead>
      <TableRow sx={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <TableCell sx={{ fontWeight: '600', fontSize: '0.9rem', py: 2 }}>S.No</TableCell>
        <TableCell sx={{ fontWeight: '600', fontSize: '0.9rem', py: 2 }}>Hotel Name</TableCell>
        <TableCell sx={{ fontWeight: '600', fontSize: '0.9rem', py: 2 }}>Hotel Code</TableCell>
        <TableCell sx={{ fontWeight: '600', fontSize: '0.9rem', py: 2 }}>QR Status</TableCell>
        <TableCell sx={{ fontWeight: '600', fontSize: '0.9rem', py: 2 }}>Registration URL</TableCell>
        <TableCell sx={{ fontWeight: '600', fontSize: '0.9rem', py: 2, textAlign: 'center' }}>Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {paginatedHotels.map((hotel, index) => {
        const generatedQR = qrCodes.find(qr => qr.hotelCode === hotel.code);

        return (
          <TableRow
            key={hotel.code}
            sx={{
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.02)',
                transition: 'all 0.2s ease'
              },
              borderBottom: '1px solid #f1f5f9'
            }}
          >
            {/* Auto Serial Number */}
            <TableCell sx={{ py: 2.5, fontWeight: 500 }}>
              {index + 1}
            </TableCell>

            <TableCell sx={{ py: 2.5 }}>
              <Typography variant="body1" fontWeight="500">
                {hotel.name}
              </Typography>
            </TableCell>

            <TableCell sx={{ py: 2.5 }}>
              <Chip
                label={hotel.code}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: '500',
                  background: 'rgba(102, 126, 234, 0.08)',
                  borderColor: 'rgba(102, 126, 234, 0.3)'
                }}
              />
            </TableCell>

            <TableCell sx={{ py: 2.5 }}>
              {generatedQR ? (
                <Chip
                  label="Generated"
                  size="small"
                  color="success"
                  variant="filled"
                  sx={{
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    background: colorScheme.success
                  }}
                />
              ) : (
                <Chip
                  label="Not Generated"
                  size="small"
                  color="default"
                  variant="outlined"
                  sx={{
                    fontWeight: '600',
                    fontSize: '0.75rem'
                  }}
                />
              )}
            </TableCell>

            <TableCell sx={{ py: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {getFullUrl(hotel.code)}
                </Typography>
                <Tooltip title="Copy URL">
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(getFullUrl(hotel.code))}
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        background: 'rgba(102, 126, 234, 0.1)',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>

            <TableCell sx={{ py: 2.5, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Button
                  variant={generatedQR ? "outlined" : "contained"}
                  size="small"
                  startIcon={generatingSingle === hotel.code ?
                    <CircularProgress size={14} /> : <QrCode2Icon />}
                  onClick={() => generateSingleQRCode(hotel)}
                  disabled={generatingSingle !== null}
                  sx={{
                    borderRadius: 1.5,
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    px: 2,
                    background: generatedQR ? 'transparent' : colorScheme.primary,
                    border: generatedQR ? `2px solid ${theme.palette.primary.main}` : 'none',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: generatedQR ? 'none' : '0 2px 8px rgba(0,0,0,0.15)'
                    },
                    transition: 'all 0.2s ease',
                    minWidth: 120
                  }}
                >
                  {generatingSingle === hotel.code ? '' :
                    generatedQR ? 'Regenerate' : 'Generate QR'}
                </Button>

                <Tooltip title="Test Registration Form">
                  <IconButton
                    size="small"
                    onClick={() => testQRUrl(hotel.code)}
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        background: 'rgba(102, 126, 234, 0.1)',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Edit Hotel">
                  <IconButton
                    size="small"
                    onClick={() => openEditHotelDialog(hotel)}
                    sx={{
                      color: 'info.main',
                      '&:hover': {
                        background: 'rgba(0, 150, 255, 0.1)',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete Hotel">
                  <IconButton
                    size="small"
                    onClick={() => openDeleteHotelDialog(hotel)}
                    sx={{
                      color: 'error.main',
                      '&:hover': {
                        background: 'rgba(244, 67, 54, 0.1)',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
</TableContainer>


          {filteredHotels.length === 0 && (
            <Box sx={{ textAlign: 'center', p: 6, color: 'text.secondary' }}>
              <HotelIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" gutterBottom fontWeight="500">
                No Hotels Found
              </Typography>
              <Typography variant="body2">
                {searchTerm ? 'Try adjusting your search terms' : 'Add your first hotel to get started'}
              </Typography>
            </Box>
          )}

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredHotels.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: '1px solid #f1f5f9' }}
          />
        </Paper>
      </Fade>

      {/* Generated QR Codes Section */}
      <Fade in timeout={1400}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, background: 'white', border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: 'text.primary', fontSize: '1.1rem' }}>
              Generated QR Codes
            </Typography>
            <Chip 
              label={qrCodes.length} 
              color="primary" 
              size="medium" 
              sx={{ 
                fontWeight: '600',
                background: colorScheme.primary
              }} 
            />
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
              <CircularProgress size={40} sx={{ color: 'primary.main' }} />
            </Box>
          ) : qrCodes.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 6, color: 'text.secondary' }}>
              <QrCode2Icon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" gutterBottom fontWeight="500">
                No QR Codes Generated
              </Typography>
              <Typography variant="body2">
                Generate your first QR code to get started
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {qrCodes.map((qr, index) => {
                const predefinedHotel = predefinedHotels.find(h => h.code === qr.hotelCode);
                
                return (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={qr.fileName}>
                    <Zoom in timeout={1000 + index * 100}>
                      <Card 
                        elevation={0}
                        sx={{ 
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          border: '1px solid #e2e8f0',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                            borderColor: 'primary.main'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center', position: 'relative' }}>
                          {/* Delete Button */}
                          <Tooltip title="Delete QR Code">
                            <IconButton
                              size="small"
                              onClick={() => openDeleteDialog(qr)}
                              disabled={deleting === qr.fileName}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                background: colorScheme.error,
                                color: 'white',
                                width: 24,
                                height: 24,
                                '&:hover': {
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                              }}
                            >
                              {deleting === qr.fileName ? 
                                <CircularProgress size={12} /> : <DeleteIcon sx={{ fontSize: 14 }} />}
                            </IconButton>
                          </Tooltip>

                          {/* QR Code Image */}
                          <Box sx={{
                            p: 1,
                            background: 'white',
                            borderRadius: 1.5,
                            display: 'inline-block',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            mb: 1.5,
                            border: '1px solid #e2e8f0'
                          }}>
                            <img
                              src={qr.qrImageUrl}
                              alt={`QR Code for ${qr.hotelCode}`}
                              style={{ 
                                width: '100%', 
                                maxWidth: 100, 
                                height: 'auto',
                                borderRadius: '4px'
                              }}
                            />
                          </Box>
                          
                          {/* Hotel Info */}
                          <Box sx={{ mb: 1.5 }}>
                            <Typography variant="body2" fontWeight="600" sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
                              {predefinedHotel ? predefinedHotel.name : qr.hotelCode}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem', mt: 0.5 }}>
                              Code: {qr.hotelCode}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                              {new Date(qr.generatedTime).toLocaleDateString()}
                            </Typography>
                          </Box>

                          {/* Action Buttons */}
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                onClick={() => downloadQRCode(qr.fileName, qr.hotelCode)}
                                sx={{ 
                                  background: colorScheme.success,
                                  color: 'white',
                                  width: 28, 
                                  height: 28,
                                  '&:hover': {
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <DownloadIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Test URL">
                              <IconButton 
                                size="small"
                                onClick={() => testQRUrl(qr.hotelCode)}
                                sx={{ 
                                  background: colorScheme.warning,
                                  color: 'white',
                                  width: 28, 
                                  height: 28,
                                  '&:hover': {
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <OpenInNewIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Copy URL">
                              <IconButton 
                                size="small"
                                onClick={() => copyToClipboard(getFullUrl(qr.hotelCode))}
                                sx={{ 
                                  background: colorScheme.info,
                                  color: 'white',
                                  width: 28, 
                                  height: 28,
                                  '&:hover': {
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </CardContent>
                      </Card>
                    </Zoom>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Paper>
      </Fade>

      {/* Add/Edit Hotel Dialog */}
      <Dialog 
        open={hotelDialogOpen} 
        onClose={() => setHotelDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ 
          sx: { 
            borderRadius: 2,
            background: 'white',
            border: '1px solid #e2e8f0'
          } 
        }}
      >
        <DialogTitle sx={{ pb: 1, fontSize: '1.1rem', fontWeight: '600', background: colorScheme.primary, color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {actionType === 'add' ? <AddIcon sx={{ mr: 1.5, fontSize: '1.3rem' }} /> : <EditIcon sx={{ mr: 1.5, fontSize: '1.3rem' }} />}
            {actionType === 'add' ? 'Add New Hotel' : 'Edit Hotel'}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            label="Hotel Code *"
            value={newHotel.code}
            onChange={(e) => setNewHotel({ ...newHotel, code: e.target.value.toLowerCase() })}
            fullWidth
            margin="normal"
            size="small"
            placeholder="e.g., beachresort"
             
            sx={{ mb: 2 }}
            disabled={actionType === 'edit'}
          />
          <TextField
            label="Hotel Name *"
            value={newHotel.name}
            onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
            fullWidth
            margin="normal"
            size="small"
            placeholder="e.g., Beach Resort"
            sx={{ mb: 2 }}
          />
          {newHotel.code && actionType === 'add' && (
            <Paper variant="outlined" sx={{ 
              p: 2, 
              mt: 2, 
              background: 'rgba(102, 126, 234, 0.03)',
              borderRadius: 1.5,
              border: '1px dashed',
              borderColor: 'primary.main'
            }}>
              <Typography variant="caption" fontWeight="600" display="block" gutterBottom color="primary.main">
                QR Code URL (after creation):
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontFamily="monospace" sx={{ 
                  fontSize: '0.75rem', 
                  flex: 1,
                  background: 'rgba(0,0,0,0.02)',
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  {getFullUrl(newHotel.code)}
                </Typography>
                <Tooltip title="Copy URL">
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(getFullUrl(newHotel.code))}
                    sx={{ 
                      background: 'primary.main',
                      color: 'white',
                      '&:hover': { background: 'primary.dark' }
                    }}
                  >
                    <ContentCopyIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={() => setHotelDialogOpen(false)}
            size="medium"
            sx={{ borderRadius: 1.5, fontWeight: '500' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveHotel}
            disabled={!newHotel.code.trim() || !newHotel.name.trim()}
            variant="contained"
            size="medium"
            startIcon={actionType === 'add' ? <AddIcon /> : <SaveIcon />}
            sx={{
              background: colorScheme.primary,
              borderRadius: 1.5,
              px: 3,
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }
            }}
          >
            {actionType === 'add' ? 'Add Hotel' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        maxWidth="xs" 
        fullWidth 
        PaperProps={{ 
          sx: { 
            borderRadius: 2,
            background: 'white',
            border: '1px solid #e2e8f0'
          } 
        }}
      >
        <DialogTitle sx={{ pb: 1, fontSize: '1.1rem', fontWeight: '600', color: 'error.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DeleteIcon sx={{ mr: 1.5, fontSize: '1.3rem' }} />
            {qrToDelete?.type === 'hotel' ? 'Delete Hotel' : 'Delete QR Code'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Are you sure you want to delete {qrToDelete?.type === 'hotel' ? 
            `the hotel "${qrToDelete?.name}"?` : 
            `the QR code for "${qrToDelete?.hotelCode}"?`}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {qrToDelete?.type === 'hotel' ? 
              'This will also remove any associated QR codes.' : 
              'This action cannot be undone and the QR code will be permanently removed.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setQrToDelete(null);
            }}
            disabled={deleting !== null}
            size="medium"
            sx={{ borderRadius: 1.5, fontWeight: '500' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            disabled={deleting !== null}
            variant="contained"
            color="error"
            size="medium"
            startIcon={deleting !== null ? <CircularProgress size={16} /> : <DeleteIcon />}
            sx={{
              background: colorScheme.error,
              borderRadius: 1.5,
              px: 3,
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(245, 87, 108, 0.3)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(245, 87, 108, 0.4)'
              }
            }}
          >
            {deleting !== null ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRCodeManager;