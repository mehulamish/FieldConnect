import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, query, where, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button, CircularProgress, MenuItem, Select } from '@mui/material';

interface EditRequest {
  id: string;
  engineerUid: string;
  engineerName: string;
  engineerEmail: string;
  reportId: string;
  type: 'edit' | 'delete';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: any;
  adminUid?: string;
  respondedAt?: any;
  hospitalName?: string;
  instituteName?: string;
}

interface UserDoc {
  id: string;
  name: string;
  email: string;
  designation: string;
}

const ROLE_OPTIONS = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Engineer', label: 'Engineer' },
  { value: 'Analyst', label: 'Analyst' },
];

const ControlAccess: React.FC = () => {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, "editRequests"), (snapshot) => {
      setRequests(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as EditRequest)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      const snap = await getDocs(collection(db, "users"));
      const usersList: UserDoc[] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserDoc));
      setUsers(usersList);
      setUsersLoading(false);
    };
    fetchUsers();
  }, []);

  const handleRequest = async (id: string, approved: boolean) => {
    setActionLoading(id + (approved ? 'approved' : 'rejected'));
    const reqRef = doc(db, 'editRequests', id);
    await updateDoc(reqRef, {
      status: approved ? 'approved' : 'rejected',
      adminUid: userProfile?.uid || '',
      respondedAt: Timestamp.now(),
    });
    setRequests(prev => prev.filter(r => r.id !== id));
    setActionLoading(null);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleUpdating(userId);
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { designation: newRole });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, designation: newRole } : u));
    setRoleUpdating(null);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-card rounded-2xl shadow-soft">
      <h1 className="text-3xl font-bold mb-4">Control Access</h1>
      <p className="mb-6 text-lg text-textSecondary">
        Manage engineer permissions for editing/deleting reports and set/change user roles.
      </p>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-accent">User Role Management</h2>
        {usersLoading ? (
          <div className="flex items-center gap-2"><CircularProgress size={24} /> Loading users...</div>
        ) : users.length === 0 ? (
          <div className="bg-muted p-4 rounded-lg text-muted-foreground">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-muted rounded-lg">
              <thead>
                <tr>
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-cardBorder last:border-none">
                    <td className="py-2 px-4 font-semibold text-textPrimary">{user.name}</td>
                    <td className="py-2 px-4 text-textSecondary">{user.email}</td>
                    <td className="py-2 px-4">
                      <Select
                        value={user.designation}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        disabled={roleUpdating === user.id}
                        size="small"
                        style={{ minWidth: 120 }}
                      >
                        {ROLE_OPTIONS.map(opt => (
                          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                      </Select>
                      {roleUpdating === user.id && <CircularProgress size={18} className="ml-2" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2 text-accent">Engineer Permission Requests</h2>
        {loading ? (
          <div className="flex items-center gap-2"><CircularProgress size={24} /> Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="bg-muted p-4 rounded-lg text-muted-foreground">No requests found.</div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="bg-muted p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-cardBorder shadow-soft">
                <div>
                  <div><b>Engineer:</b> <span className="text-accent font-semibold">{req.engineerName}</span> <span className="text-textSecondary">({req.engineerEmail})</span></div>
                  <div><b>Hospital/Institute:</b> <span className="text-textPrimary">{req.hospitalName || req.instituteName || '-'}</span></div>
                  <div><b>Report ID:</b> <span className="text-textSecondary">{req.reportId}</span></div>
                  <div><b>Requested At:</b> <span className="text-textSecondary">{req.requestedAt?.toDate ? req.requestedAt.toDate().toLocaleString() : ''}</span></div>
                  <div><b>Status:</b> <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${req.status === 'approved' ? 'bg-green-600' : req.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span></div>
                  {req.status !== 'pending' && req.respondedAt && (
                    <div><b>Responded At:</b> <span className="text-textSecondary">{req.respondedAt.toDate ? req.respondedAt.toDate().toLocaleString() : ''}</span></div>
                  )}
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button
                      variant="contained"
                      color="success"
                      disabled={actionLoading === req.id + 'approved'}
                      onClick={() => handleRequest(req.id, true)}
                      className="rounded-xl shadow-soft"
                    >
                      {actionLoading === req.id + 'approved' ? <CircularProgress size={18} /> : 'Approve'}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      disabled={actionLoading === req.id + 'rejected'}
                      onClick={() => handleRequest(req.id, false)}
                      className="rounded-xl shadow-soft"
                    >
                      {actionLoading === req.id + 'rejected' ? <CircularProgress size={18} /> : 'Reject'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlAccess; 