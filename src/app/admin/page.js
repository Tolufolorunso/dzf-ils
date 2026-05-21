'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import styles from './page.module.css';

function formatDateTime(value) {
  if (!value) return 'Not published yet';
  return new Date(value).toLocaleString();
}

function AdminDashboardContent() {
  const [competitionData, setCompetitionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');
  const [pageSuccess, setPageSuccess] = useState('');
  const [controlSubmitting, setControlSubmitting] = useState(false);

  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState('');
  const [overrideForm, setOverrideForm] = useState({ patronBarcode: '', itemBarcode: '' });

  const [patronSearch, setPatronSearch] = useState('');
  const [patronResults, setPatronResults] = useState([]);
  const [patronLoading, setPatronLoading] = useState(false);
  const [showPatronModal, setShowPatronModal] = useState(false);
  const [selectedPatron, setSelectedPatron] = useState(null);
  const [patronSaving, setPatronSaving] = useState(false);

  const fetchAdminData = async ({ background = false } = {}) => {
    try {
      if (background) setRefreshing(true);
      else setLoading(true);

      const response = await fetch('/api/competition');
      const data = await response.json();
      if (!data.status) {
        setPageError(data.message || 'Failed to fetch admin competition data.');
        return;
      }

      setCompetitionData(data.data);
      setPageError('');
    } catch (error) {
      console.error('Admin competition fetch error:', error);
      setPageError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPatrons = async (query = '') => {
    try {
      setPatronLoading(true);
      const response = await fetch(`/api/admin/patrons?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.status) setPatronResults(data.data || []);
    } catch (error) {
      console.error('Admin patrons fetch error:', error);
    } finally {
      setPatronLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchPatrons();
  }, []);

  const handleResultVisibility = async (isPublished) => {
    try {
      setSubmitting(true);
      setPageError('');
      setPageSuccess('');

      const response = await fetch('/api/competition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setresultpublication', isPublished }),
      });

      const data = await response.json();
      if (!data.status) {
        setPageError(data.message || 'Failed to update result visibility.');
        return;
      }

      setPageSuccess(data.message);
      fetchAdminData({ background: true });
    } catch (error) {
      console.error('Result visibility update error:', error);
      setPageError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompetitionControlUpdate = async (payload) => {
    try {
      setControlSubmitting(true);
      setPageError('');
      setPageSuccess('');

      const response = await fetch('/api/competition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setcirculationcontrols',
          ...payload,
        }),
      });

      const data = await response.json();
      if (!data.status) {
        setPageError(data.message || 'Failed to update competition controls.');
        return;
      }

      setPageSuccess(data.message || 'Competition controls updated.');
      fetchAdminData({ background: true });
    } catch (error) {
      console.error('Competition controls update error:', error);
      setPageError('Network error. Please try again.');
    } finally {
      setControlSubmitting(false);
    }
  };

  const handleCirculationOverride = async (event) => {
    event.preventDefault();
    setOverrideLoading(true);
    setOverrideError('');
    setOverrideSuccess('');

    try {
      const response = await fetch('/api/admin/circulation-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideForm),
      });

      const data = await response.json();
      if (!data.status) {
        setOverrideError(data.message || 'Failed to run circulation override.');
        return;
      }

      setOverrideSuccess(`${data.message} hasBorrowedBook=${data.data.hasBorrowedBook}, isCheckedOut=${data.data.isCheckedOut}`);
      setOverrideForm({ patronBarcode: '', itemBarcode: '' });
      fetchPatrons(patronSearch);
    } catch (error) {
      console.error('Circulation override error:', error);
      setOverrideError('Network error. Please try again.');
    } finally {
      setOverrideLoading(false);
    }
  };

  const openPatronModal = async (barcode) => {
    try {
      setPatronLoading(true);
      const response = await fetch(`/api/admin/patrons?barcode=${encodeURIComponent(barcode)}`);
      const data = await response.json();
      if (!data.status) {
        setPageError(data.message || 'Failed to load patron details.');
        return;
      }
      setSelectedPatron(data.data);
      setShowPatronModal(true);
    } catch (error) {
      console.error('Open patron modal error:', error);
      setPageError('Network error while opening patron.');
    } finally {
      setPatronLoading(false);
    }
  };

  const savePatron = async () => {
    if (!selectedPatron) return;

    try {
      setPatronSaving(true);
      const response = await fetch('/api/admin/patrons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: selectedPatron.barcode,
          firstname: selectedPatron.firstname || '',
          surname: selectedPatron.surname || '',
          middlename: selectedPatron.middlename || '',
          patronType: selectedPatron.patronType || '',
          gender: selectedPatron.gender || '',
          email: selectedPatron.email || '',
          phoneNumber: selectedPatron.phoneNumber || '',
          points: Number(selectedPatron.points || 0),
          active: Boolean(selectedPatron.active),
          hasBorrowedBook: Boolean(selectedPatron.hasBorrowedBook),
          isPatronExpiry: Boolean(selectedPatron.isPatronExpiry),
          dateOfBirth: selectedPatron.dateOfBirth || '',
          patronExpiryDate: selectedPatron.patronExpiryDate || '',
          library: selectedPatron.library || '',
          registeredBy: selectedPatron.registeredBy || '',
          messagePreferences: selectedPatron.messagePreferences || [],
          address: selectedPatron.address || {},
          studentSchoolInfo: selectedPatron.studentSchoolInfo || {},
          parentInfo: selectedPatron.parentInfo || {},
          employerInfo: selectedPatron.employerInfo || {},
          itemBarcode: selectedPatron.lastBorrowedItem?.itemBarcode || '',
        }),
      });

      const data = await response.json();
      if (!data.status) {
        setPageError(data.message || 'Failed to save patron.');
        return;
      }

      setPageSuccess('Patron updated successfully.');
      setShowPatronModal(false);
      fetchPatrons(patronSearch);
    } catch (error) {
      console.error('Save patron error:', error);
      setPageError('Network error while saving patron.');
    } finally {
      setPatronSaving(false);
    }
  };

  const stats = competitionData?.stats;
  const session = competitionData?.session;
  const publication = competitionData?.resultPublication;
  const isPublished = Boolean(publication?.isPublished);
  const circulationControls = competitionData?.circulationControls || {
    checkoutEnabled: true,
    checkinEnabled: true,
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Admin Control Center</p>
          <h1 className={styles.title}>Run global admin controls from one page.</h1>
          <p className={styles.subtitle}>Manage circulation recovery, patron management, and competition publishing.</p>
        </div>
        <div className={styles.heroPanel}>
          <span className={styles.panelLabel}>Current Competition Session</span>
          <strong>{session?.title || 'No active competition session'}</strong>
          <span>Session key: {session?.sessionKey || 'Not available'}</span>
          <span>Result page status: <strong className={isPublished ? styles.statusOn : styles.statusOff}>{isPublished ? 'Visible to everyone' : 'Hidden from everyone'}</strong></span>
        </div>
      </section>

      <main className={styles.content}>
        {pageError && <Alert type='error' message={pageError} onClose={() => setPageError('')} />}
        {pageSuccess && <Alert type='success' message={pageSuccess} onClose={() => setPageSuccess('')} />}

        {loading ? (
          <Card title='Loading Admin Controls'><div className={styles.emptyState}>Pulling data...</div></Card>
        ) : (
          <>
            <section className={styles.statsGrid}>
              <div className={styles.statCard}><span>Readers Logged</span><strong>{stats?.totalParticipants ?? 0}</strong></div>
              <div className={styles.statCard}><span>Books Read</span><strong>{stats?.totalBooksRead ?? 0}</strong></div>
              <div className={styles.statCard}><span>Total Grade</span><strong>{stats?.totalGrade ?? 0}</strong></div>
              <div className={styles.statCard}><span>Top Board Size</span><strong>{stats?.leaderboardCount ?? 0}</strong></div>
            </section>

            <section className={styles.grid}>
              <Card title='Competition Circulation Controls'>
                <div className={styles.controlPanel}>
                  <div className={styles.metaList}>
                    <div className={styles.metaRow}>
                      <span>Checkout API + Staff Form</span>
                      <strong>
                        {circulationControls.checkoutEnabled
                          ? 'Enabled'
                          : 'Disabled'}
                      </strong>
                    </div>
                    <div className={styles.metaRow}>
                      <span>Check-in API + Staff Form</span>
                      <strong>
                        {circulationControls.checkinEnabled
                          ? 'Enabled'
                          : 'Disabled'}
                      </strong>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <Button
                      variant='secondary'
                      onClick={() =>
                        handleCompetitionControlUpdate({
                          checkoutEnabled: !circulationControls.checkoutEnabled,
                        })
                      }
                      disabled={controlSubmitting}
                    >
                      {circulationControls.checkoutEnabled
                        ? 'Disable Checkout'
                        : 'Enable Checkout'}
                    </Button>
                    <Button
                      variant='secondary'
                      onClick={() =>
                        handleCompetitionControlUpdate({
                          checkinEnabled: !circulationControls.checkinEnabled,
                        })
                      }
                      disabled={controlSubmitting}
                    >
                      {circulationControls.checkinEnabled
                        ? 'Disable Check-in'
                        : 'Enable Check-in'}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card title='Reading Result Visibility'>
                <div className={styles.controlPanel}>
                  <div className={styles.statusCard}>
                    <span className={styles.statusLabel}>Public result page</span>
                    <strong>{isPublished ? 'Published' : 'Hidden'}</strong>
                  </div>
                  <div className={styles.metaList}>
                    <div className={styles.metaRow}><span>Published by</span><strong>{publication?.publishedBy || 'Nobody yet'}</strong></div>
                    <div className={styles.metaRow}><span>Published at</span><strong>{formatDateTime(publication?.publishedAt)}</strong></div>
                  </div>
                  <div className={styles.actions}>
                    <Button variant='primary' onClick={() => handleResultVisibility(true)} disabled={submitting || isPublished}>{submitting && !isPublished ? 'Publishing...' : 'Publish Result Page'}</Button>
                    <Button variant='secondary' onClick={() => handleResultVisibility(false)} disabled={submitting || !isPublished}>{submitting && isPublished ? 'Hiding...' : 'Hide Result Page'}</Button>
                    <Button variant='secondary' onClick={() => fetchAdminData({ background: true })} disabled={refreshing}>{refreshing ? 'Refreshing...' : 'Refresh Data'}</Button>
                  </div>
                </div>
              </Card>

              <Card title='Competition Quick Links'>
                <div className={styles.linkGrid}>
                  <Link href='/competitions/reading' className={styles.linkCard}><strong>Staff Reading Page</strong><span>Manage checkout/check-in.</span></Link>
                  <Link href='/competitions/reading/live' className={styles.linkCard}><strong>Public Live Board</strong><span>Current public leaderboard.</span></Link>
                  <Link href='/competitions/reading/result' className={styles.linkCard}><strong>Public Result Page</strong><span>Preview final result board.</span></Link>
                </div>
              </Card>
            </section>

            <section className={styles.futureSection}>
              <Card title='Circulation Recovery Controls'>
                <form className={styles.overrideForm} onSubmit={handleCirculationOverride}>
                  <p className={styles.overrideHelp}>Fix stuck circulation states by syncing patron `hasBorrowedBook` and item `isCheckedOut`.</p>
                  {overrideError && <Alert type='error' message={overrideError} onClose={() => setOverrideError('')} />}
                  {overrideSuccess && <Alert type='success' message={overrideSuccess} onClose={() => setOverrideSuccess('')} />}
                  <label className={styles.overrideLabel}>Patron Barcode<input className={styles.overrideInput} name='patronBarcode' value={overrideForm.patronBarcode} onChange={(e) => setOverrideForm((p) => ({ ...p, patronBarcode: e.target.value }))} required /></label>
                  <label className={styles.overrideLabel}>Item Barcode<input className={styles.overrideInput} name='itemBarcode' value={overrideForm.itemBarcode} onChange={(e) => setOverrideForm((p) => ({ ...p, itemBarcode: e.target.value }))} required /></label>
                  <div className={styles.actions}><Button type='submit' variant='primary' disabled={overrideLoading}>{overrideLoading ? 'Applying...' : 'Run Override'}</Button></div>
                </form>
              </Card>
            </section>

            <section className={styles.futureSection}>
              <Card title='Patron Manager'>
                <div className={styles.overrideForm}>
                  <p className={styles.overrideHelp}>Search patrons and open a full modal to manage account/circulation flags quickly.</p>
                  <label className={styles.overrideLabel}>Search Patron<input className={styles.overrideInput} value={patronSearch} onChange={(e) => setPatronSearch(e.target.value)} placeholder='Name or barcode' /></label>
                  <div className={styles.actions}><Button variant='secondary' onClick={() => fetchPatrons(patronSearch)} disabled={patronLoading}>{patronLoading ? 'Loading...' : 'Search'}</Button></div>
                  <div className={styles.patronList}>
                    {patronResults.slice(0, 20).map((patron) => (
                      <button key={patron.barcode} className={styles.patronListItem} onClick={() => openPatronModal(patron.barcode)}>
                        <strong>{patron.surname}, {patron.firstname}</strong>
                        <span>{patron.barcode} | {patron.patronType} | {patron.active ? 'Active' : 'Inactive'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </section>
          </>
        )}
      </main>

      <Modal
        isOpen={showPatronModal}
        onClose={() => setShowPatronModal(false)}
        title={selectedPatron ? `Patron: ${selectedPatron.surname}, ${selectedPatron.firstname}` : 'Patron'}
      >
        {selectedPatron && (
          <div className={styles.overrideForm}>
            <div className={styles.modalSectionTitle}>Core Profile</div>
            <label className={styles.overrideLabel}>First Name<input className={styles.overrideInput} value={selectedPatron.firstname || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, firstname: e.target.value }))} /></label>
            <label className={styles.overrideLabel}>Surname<input className={styles.overrideInput} value={selectedPatron.surname || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, surname: e.target.value }))} /></label>
            <label className={styles.overrideLabel}>Middle Name<input className={styles.overrideInput} value={selectedPatron.middlename || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, middlename: e.target.value }))} /></label>
            <label className={styles.overrideLabel}>Patron Type<select className={styles.overrideInput} value={selectedPatron.patronType || 'student'} onChange={(e) => setSelectedPatron((p) => ({ ...p, patronType: e.target.value }))}><option value='student'>student</option><option value='teacher'>teacher</option><option value='staff'>staff</option><option value='guest'>guest</option></select></label>
            <label className={styles.overrideLabel}>Gender<select className={styles.overrideInput} value={selectedPatron.gender || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, gender: e.target.value }))}><option value=''>none</option><option value='male'>male</option><option value='female'>female</option></select></label>

            <div className={styles.modalSectionTitle}>Contact</div>
            <label className={styles.overrideLabel}>Email<input className={styles.overrideInput} value={selectedPatron.email || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, email: e.target.value }))} /></label>
            <label className={styles.overrideLabel}>Phone<input className={styles.overrideInput} value={selectedPatron.phoneNumber || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, phoneNumber: e.target.value }))} /></label>
            <label className={styles.overrideLabel}>Library<input className={styles.overrideInput} value={selectedPatron.library || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, library: e.target.value }))} /></label>
            <label className={styles.overrideLabel}>Registered By<input className={styles.overrideInput} value={selectedPatron.registeredBy || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, registeredBy: e.target.value }))} /></label>

            <div className={styles.modalSectionTitle}>Address</div>
            <label className={styles.overrideLabel}>Street<input className={styles.overrideInput} value={selectedPatron.address?.street || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, address: { ...(p.address || {}), street: e.target.value } }))} /></label>
            <label className={styles.overrideLabel}>City<input className={styles.overrideInput} value={selectedPatron.address?.city || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, address: { ...(p.address || {}), city: e.target.value } }))} /></label>
            <label className={styles.overrideLabel}>State<input className={styles.overrideInput} value={selectedPatron.address?.state || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, address: { ...(p.address || {}), state: e.target.value } }))} /></label>
            <label className={styles.overrideLabel}>Country<input className={styles.overrideInput} value={selectedPatron.address?.country || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, address: { ...(p.address || {}), country: e.target.value } }))} /></label>

            <div className={styles.modalSectionTitle}>School / Parent</div>
            <label className={styles.overrideLabel}>School Name<input className={styles.overrideInput} value={selectedPatron.studentSchoolInfo?.schoolName || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, studentSchoolInfo: { ...(p.studentSchoolInfo || {}), schoolName: e.target.value } }))} /></label>
            <label className={styles.overrideLabel}>Current Class<input className={styles.overrideInput} value={selectedPatron.studentSchoolInfo?.currentClass || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, studentSchoolInfo: { ...(p.studentSchoolInfo || {}), currentClass: e.target.value } }))} /></label>
            <label className={styles.overrideLabel}>Parent Name<input className={styles.overrideInput} value={selectedPatron.parentInfo?.parentName || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, parentInfo: { ...(p.parentInfo || {}), parentName: e.target.value } }))} /></label>
            <label className={styles.overrideLabel}>Parent Phone<input className={styles.overrideInput} value={selectedPatron.parentInfo?.parentPhoneNumber || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, parentInfo: { ...(p.parentInfo || {}), parentPhoneNumber: e.target.value } }))} /></label>

            <div className={styles.modalSectionTitle}>Employer</div>
            <label className={styles.overrideLabel}>Employer Name<input className={styles.overrideInput} value={selectedPatron.employerInfo?.employerName || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, employerInfo: { ...(p.employerInfo || {}), employerName: e.target.value } }))} /></label>
            <label className={styles.overrideLabel}>Employer School<input className={styles.overrideInput} value={selectedPatron.employerInfo?.schoolName || ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, employerInfo: { ...(p.employerInfo || {}), schoolName: e.target.value } }))} /></label>

            <div className={styles.modalSectionTitle}>Circulation & Account</div>
            <label className={styles.overrideLabel}>Points<input type='number' className={styles.overrideInput} value={selectedPatron.points || 0} onChange={(e) => setSelectedPatron((p) => ({ ...p, points: Number(e.target.value) }))} /></label>
            <label className={styles.overrideLabel}>Date of Birth<input type='date' className={styles.overrideInput} value={selectedPatron.dateOfBirth ? new Date(selectedPatron.dateOfBirth).toISOString().split('T')[0] : ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, dateOfBirth: e.target.value }))} /></label>
            <label className={styles.overrideLabel}>Expiry Date<input type='date' className={styles.overrideInput} value={selectedPatron.patronExpiryDate ? new Date(selectedPatron.patronExpiryDate).toISOString().split('T')[0] : ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, patronExpiryDate: e.target.value }))} /></label>
            <label className={styles.overrideLabel}>Message Preferences (comma separated)<input className={styles.overrideInput} value={Array.isArray(selectedPatron.messagePreferences) ? selectedPatron.messagePreferences.join(', ') : ''} onChange={(e) => setSelectedPatron((p) => ({ ...p, messagePreferences: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) }))} /></label>
            <label className={styles.toggleRow}><input type='checkbox' checked={Boolean(selectedPatron.active)} onChange={(e) => setSelectedPatron((p) => ({ ...p, active: e.target.checked }))} />Active</label>
            <label className={styles.toggleRow}><input type='checkbox' checked={Boolean(selectedPatron.hasBorrowedBook)} onChange={(e) => setSelectedPatron((p) => ({ ...p, hasBorrowedBook: e.target.checked }))} />hasBorrowedBook</label>
            <label className={styles.toggleRow}><input type='checkbox' checked={Boolean(selectedPatron.isPatronExpiry)} onChange={(e) => setSelectedPatron((p) => ({ ...p, isPatronExpiry: e.target.checked }))} />isPatronExpiry</label>
            <Button variant='primary' onClick={savePatron} disabled={patronSaving}>{patronSaving ? 'Saving...' : 'Save Patron Changes'}</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole='admin'>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
