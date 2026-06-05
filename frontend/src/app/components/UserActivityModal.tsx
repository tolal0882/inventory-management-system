import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { User, UserActivityLog } from '../types';
import { Clock, MapPin, Monitor, LogIn, LogOut, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { activityLogsApi } from '../services/api';

interface UserActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  activityLogs?: UserActivityLog[]; // kept for API compat but ignored — modal fetches live
}

function formatTimestamp(raw: string): { date: string; time: string; full: string } {
  const d = new Date(raw);
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  return { date, time, full: `${date} · ${time}` };
}

export const UserActivityModal: React.FC<UserActivityModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [logs, setLogs] = useState<UserActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen || !user) return;
    setIsLoading(true);
    setError(null);
    setLogs([]);
    setExpandedRows(new Set());
    activityLogsApi.getByUser(user.id)
      .then((data: UserActivityLog[]) => setLogs(data))
      .catch((err: any) => setError(err.message || 'Failed to load activity logs'))
      .finally(() => setIsLoading(false));
  }, [isOpen, user?.id]);

  if (!user) return null;

  const toggleRow = (logId: string) => {
    const next = new Set(expandedRows);
    next.has(logId) ? next.delete(logId) : next.add(logId);
    setExpandedRows(next);
  };

  const totalLogins = logs.filter(l => l.action === 'Login').length;
  const totalLogouts = logs.filter(l => l.action === 'Logout').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Activity Timeline — {user.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* User summary */}
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Name</p>
              <p className="font-medium text-sm">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Email</p>
              <p className="font-medium text-sm truncate">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Role</p>
              <Badge className="text-xs">{user.role?.replace(/_/g, ' ')}</Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Status</p>
              <Badge variant={user.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                {user.status}
              </Badge>
            </div>
          </div>

          {/* Stats row */}
          {logs.length > 0 && (
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{totalLogins}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Logins</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">{totalLogouts}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Logouts</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{logs.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Activities</p>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="border rounded-lg overflow-hidden shrink-0">
            <div className="bg-gradient-to-r from-[#1E90FF] to-[#1565C0] px-4 py-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-white" />
              <h3 className="font-semibold text-white text-sm">Login / Logout History</h3>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-14 text-gray-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">Loading activity logs…</p>
              </div>
            )}

            {/* Error */}
            {!isLoading && error && (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-red-500">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Empty */}
            {!isLoading && !error && logs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 text-gray-400 gap-3">
                <Clock className="w-10 h-10 text-gray-200" />
                <p className="text-sm">No activity recorded for this user yet.</p>
                <p className="text-xs text-gray-400">Logs appear after the user logs in or out.</p>
              </div>
            )}

            {/* Log entries */}
            {!isLoading && !error && logs.length > 0 && (
              <div className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const isExpanded = expandedRows.has(log.id);
                  const ts = formatTimestamp(log.timestamp);
                  const isLogin = log.action === 'Login';

                  return (
                    <div key={log.id} className="hover:bg-gray-50 transition-colors">
                      <div className="px-4 py-3 cursor-pointer" onClick={() => toggleRow(log.id)}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Icon */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isLogin ? 'bg-green-100' : 'bg-orange-100'}`}>
                              {isLogin
                                ? <LogIn className="w-4 h-4 text-green-600" />
                                : <LogOut className="w-4 h-4 text-orange-600" />
                              }
                            </div>

                            {/* Action + time */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={`text-xs font-semibold border-0 ${isLogin ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
                                >
                                  {log.action}
                                </Badge>
                                <span className="text-xs text-gray-400">{ts.full}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{log.location || 'Unknown location'}</span>
                              </div>
                            </div>
                          </div>

                          <Button variant="ghost" size="sm" className="shrink-0 h-7 w-7 p-0">
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4 text-gray-400" />
                              : <ChevronDown className="w-4 h-4 text-gray-400" />
                            }
                          </Button>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-blue-50 rounded-lg p-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Date</p>
                              </div>
                              <p className="text-sm font-medium text-gray-900">{ts.date}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{ts.time}</p>
                            </div>

                            <div className="bg-purple-50 rounded-lg p-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Monitor className="w-3.5 h-3.5 text-purple-500" />
                                <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide">IP Address</p>
                              </div>
                              <p className="text-sm font-medium font-mono text-gray-900">{log.ipAddress || '—'}</p>
                            </div>

                            <div className="bg-green-50 rounded-lg p-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Monitor className="w-3.5 h-3.5 text-green-500" />
                                <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">Device</p>
                              </div>
                              <p className="text-sm font-medium text-gray-900 leading-snug">{log.device || '—'}</p>
                            </div>

                            <div className="bg-orange-50 rounded-lg p-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                                <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide">Location</p>
                              </div>
                              <p className="text-sm font-medium text-gray-900">{log.location || '—'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
