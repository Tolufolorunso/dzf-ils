'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Alert from '@/components/ui/Alert';
import styles from '../patrons.module.css';

export default function PatronDetailPage() {
  const params = useParams();
  const [patron, setPatron] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (params.barcode) {
      fetchPatron();
    }
  }, [params.barcode]);

  const fetchPatron = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patrons/${params.barcode}`);
      const data = await response.json();

      if (data.status) {
        setPatron(data.data);
      } else {
        setError(data.message || 'Failed to fetch patron details');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Patron fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (patron) => {
    if (!patron) return '';
    const first = patron.firstname?.charAt(0) || '';
    const last = patron.surname?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  const getPatronTypeBadge = (type) => {
    const typeColors = {
      student: 'primary',
      teacher: 'successBadge',
      staff: 'warningBadge',
      guest: 'default',
    };
    return <Badge variant={typeColors[type] || 'default'}>{type}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage({
        file,
        preview: reader.result,
      });
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async (imageData) => {
    try {
      setUploading(true);
      setError('');

      const response = await fetch('/api/patrons/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode: patron.barcode,
          photoData: imageData,
        }),
      });

      const data = await response.json();

      if (data.status) {
        setPatron((prev) => ({
          ...prev,
          image_url: {
            secure_url: data.data.imageUrl,
          },
        }));
        setShowCropper(false);
        setSelectedImage(null);
      } else {
        setError(data.message || 'Failed to upload image');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraInput = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        // Try front camera first, then back camera
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
          });
        } catch (frontCameraError) {
          // If front camera fails, try back camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
          });
        }

        setCameraStream(stream);
        setShowCameraModal(true);

        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      } catch (err) {
        console.log('Camera access failed, falling back to file input:', err);
        setError('Camera access denied. Please use "Choose File" instead.');
        cameraInputRef.current?.click();
      }
    } else {
      console.log('getUserMedia not supported, using file input');
      cameraInputRef.current?.click();
    }
  };

  const cropImage = (imageSrc) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const image = new Image();

      image.onload = () => {
        const size = 300;
        canvas.width = size;
        canvas.height = size;

        const minDimension = Math.min(image.width, image.height);
        const cropX = (image.width - minDimension) / 2;
        const cropY = (image.height - minDimension) / 2;

        ctx.drawImage(
          image,
          cropX,
          cropY,
          minDimension,
          minDimension,
          0,
          0,
          size,
          size
        );

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      image.src = imageSrc;
    });
  };

  const handleCropConfirm = async () => {
    if (!selectedImage) return;
    const croppedImage = await cropImage(selectedImage.preview);
    await handlePhotoUpload(croppedImage);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }

    setShowCameraModal(false);
    setCameraStream(null);
    setSelectedImage({
      file: null,
      preview: imageData,
    });
    setShowCropper(true);
  };

  const closeCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setShowCameraModal(false);
    setCameraStream(null);
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p>Loading patron details...</p>
        </div>
      </div>
    );
  }

  if (error && !patron) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <Alert type='error' message={error} />
          <Link href='/patrons'>
            <Button variant='primary'>Back to Patrons</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!patron) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <Alert type='error' message='Patron not found' />
          <Link href='/patrons'>
            <Button variant='primary'>Back to Patrons</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerActions}>
          <Link href='/patrons'>
            <Button variant='secondary'>← Back to Patrons</Button>
          </Link>
          <Link href={`/patrons/${patron.barcode}/edit`}>
            <Button variant='primary'>Edit Patron</Button>
          </Link>
        </div>
      </div>

      {error && <Alert type='error' message={error} />}

      <div className={styles.detailGrid}>
        {/* Enhanced Patron Avatar Card */}
        <Card title='Patron Photo' className={styles.avatarCard}>
          <div className={styles.avatarCardContent}>
            <div className={styles.largeAvatarContainer}>
              <Avatar
                size='xl'
                src={patron.image_url?.secure_url}
                initial={getInitials(patron)}
              />
            </div>
            <div className={styles.photoActions}>
              <Button
                variant='primary'
                onClick={triggerFileInput}
                disabled={uploading}
                className={styles.photoButton}
              >
                📁 Choose File
              </Button>
              <Button
                variant='secondary'
                onClick={triggerCameraInput}
                disabled={uploading}
                className={styles.photoButton}
              >
                📷 Take Photo
              </Button>
            </div>
            <p className={styles.photoHint}>
              Upload a clear photo for easy identification
            </p>

            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            <input
              ref={cameraInputRef}
              type='file'
              accept='image/*'
              capture='user'
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </div>
        </Card>

        {/* Patron Basic Info Card */}
        <Card title='Patron Information'>
          <div className={styles.patronBasicInfo}>
            <h2 className={styles.patronName}>
              {patron.surname}, {patron.firstname} {patron.middlename}
            </h2>
            <div className={styles.patronBadges}>
              {getPatronTypeBadge(patron.patronType)}
              {patron.gender && (
                <Badge variant='default'>{patron.gender}</Badge>
              )}
            </div>
            <div className={styles.patronBarcode}>
              Barcode: <strong>{patron.barcode}</strong>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card title='Contact Information'>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Email:</label>
              <span>{patron.email || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Phone:</label>
              <span>{patron.phoneNumber || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Address:</label>
              <span>
                {patron.address?.street && `${patron.address.street}, `}
                {patron.address?.city && `${patron.address.city}, `}
                {patron.address?.state && `${patron.address.state}, `}
                {patron.address?.country || 'N/A'}
              </span>
            </div>
          </div>
        </Card>

        {/* School Information */}
        {patron.patronType === 'student' && patron.studentSchoolInfo && (
          <Card title='School Information'>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>School:</label>
                <span>{patron.studentSchoolInfo.schoolName || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Class:</label>
                <span>{patron.studentSchoolInfo.currentClass || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>School Email:</label>
                <span>{patron.studentSchoolInfo.schoolEmail || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>School Phone:</label>
                <span>
                  {patron.studentSchoolInfo.schoolPhoneNumber || 'N/A'}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Parent Information */}
        {patron.patronType === 'student' && patron.parentInfo && (
          <Card title='Parent Information'>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Parent Name:</label>
                <span>{patron.parentInfo.parentName || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Relationship:</label>
                <span>{patron.parentInfo.relationshipToPatron || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Parent Email:</label>
                <span>{patron.parentInfo.parentEmail || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Parent Phone:</label>
                <span>{patron.parentInfo.parentPhoneNumber || 'N/A'}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Account Information */}
        <Card title='Account Information'>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Points:</label>
              <span className={styles.pointsValue}>{patron.points || 0}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Expiry Date:</label>
              <span>{formatDate(patron.patronExpiryDate)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Registered By:</label>
              <span>{patron.registeredBy || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Message Preferences:</label>
              <span>{patron.messagePreferences?.join(', ') || 'N/A'}</span>
            </div>
          </div>
        </Card>

        {/* Borrowing History */}
        <Card title='Borrowing History'>
          {patron.itemsCheckedOutHistory &&
          patron.itemsCheckedOutHistory.length > 0 ? (
            <div className={styles.historyList}>
              {patron.itemsCheckedOutHistory.map((item, index) => (
                <div key={index} className={styles.historyItem}>
                  <div className={styles.historyItemHeader}>
                    <strong>{item.itemTitle}</strong>
                    {item.eventTitle && (
                      <Badge variant='info'>{item.eventTitle}</Badge>
                    )}
                  </div>
                  <div className={styles.historyItemDetails}>
                    <span>Barcode: {item.itemBarcode}</span>
                    <span>Checked out: {formatDate(item.checkoutDate)}</span>
                    <span>Due: {formatDate(item.dueDate)}</span>
                    {item.returnedAt && (
                      <span>Returned: {formatDate(item.returnedAt)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noHistory}>No borrowing history available</p>
          )}
        </Card>
      </div>

      {/* Camera Modal */}
      {showCameraModal && (
        <div className={styles.cropperModal}>
          <div className={styles.cropperContent}>
            <h3>Take Photo</h3>
            <div className={styles.cameraPreview}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={styles.cameraVideo}
              />
            </div>
            <div className={styles.cropperActions}>
              <Button variant='secondary' onClick={closeCameraModal}>
                Cancel
              </Button>
              <Button variant='primary' onClick={capturePhoto}>
                📷 Capture
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {showCropper && selectedImage && (
        <div className={styles.cropperModal}>
          <div className={styles.cropperContent}>
            <h3>Crop Photo</h3>
            <div className={styles.cropperPreview}>
              <img
                src={selectedImage.preview}
                alt='Preview'
                className={styles.cropperImage}
              />
              <div className={styles.cropInfo}>
                <p>Photo will be cropped to a square for the avatar</p>
              </div>
            </div>
            <div className={styles.cropperActions}>
              <Button
                variant='secondary'
                onClick={() => {
                  setShowCropper(false);
                  setSelectedImage(null);
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                variant='primary'
                onClick={handleCropConfirm}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
