import React, { useMemo, useState } from 'react';
import { Card, Button, Badge } from '../../components/UI';
import { 
    Users, 
    Zap, 
    AlertTriangle, 
    Activity, 
    LogOut, 
    FileWarning, 
    BarChart2, 
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    RefreshCw,
    Globe,
    ArrowRight
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    CartesianGrid, 
    Legend
} from 'recharts';
import { UserRole, Exam, User, Appeal } from '../../types';

interface Props {
  onLogout?: () => void;
  exams: Exam[];
  users: User[];
  appeals: Appeal[];
}

const AdminDashboard: React.FC<Props> = ({ onLogout, exams, users, appeals }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    
    // --- 1. INTELLIGENCE ENGINE (Data Processing) ---
    const intelligence = useMemo(() => {
        const students = users.filter(u => u.role === UserRole.STUDENT);
        const totalUsers = students.length;
        
        // Simulating "Active" vs "Churn Risk" logic based on data
        const activeUsers = students.filter(u => u.status === 'ACTIVE').length; 
        const churnRiskCount = students.filter(u => u.status === 'BLOCKED').length;
        
        // Engagement Calculation
        const healthScore = totalUsers > 0 ? Math.min(100, Math.round((activeUsers / totalUsers) * 100)) : 0;
        
        // Content Health
        const pendingAppeals = appeals.filter(a => a.status === 'PENDING').length;

        // Exam Health
        const liveExams = exams.filter(e => e.type === 'LIVE').length;
        
        return { 
            totalUsers, 
            activeUsers, 
            churnRiskCount, 
            healthScore,
            pendingAppeals,
            liveExams
        };
    }, [refreshKey, exams, users, appeals]);

    // --- TRAFFIC MOCK DATA ---
    const traffic24hData = [
      { time: '00:00', visitors: 45 },
      { time: '04:00', visitors: 12 },
      { time: '08:00', visitors: 185 },
      { time: '12:00', visitors: 420 },
      { time: '16:00', visitors: 350 },
      { time: '20:00', visitors: 290 },
      { time: '23:59', visitors: 110 },
    ];

    const trafficMonthlyData = [
        { week: 'Week 1', visitors: 2400 },
        { week: 'Week 2', visitors: 3100 },
        { week: 'Week 3', visitors: 2800 },
        { week: 'Week 4', visitors: 3500 },
    ];

    // --- TREND DATA ---
    const growthData = [
        { name: 'Mon', newUsers: 4, activeUsers: 120 },
        { name: 'Tue', newUsers: 6, activeUsers: 132 },
        { name: 'Wed', newUsers: 8, activeUsers: 128 },
        { name: 'Thu', newUsers: 12, activeUsers: 145 },
        { name: 'Fri', newUsers: 9, activeUsers: 150 },
        { name: 'Sat', newUsers: 15, activeUsers: 168 },
        { name: 'Sun', newUsers: 10, activeUsers: 175 + (refreshKey * 2) },
    ];

    const examPerformanceData = [
        { name: 'Physics Wk1', avgScore: 65, participation: 85 },
        { name: 'Math Ch3', avgScore: 45, participation: 40 },
        { name: 'Chem Org', avgScore: 78, participation: 92 },
        { name: 'Eng Gram', avgScore: 82, participation: 70 },
    ];

    // --- ALERTS & ACTION QUEUE ---
    const alerts = [
        { 
            id: 1, 
            level: 'CRITICAL', 
            msg: `${intelligence.pendingAppeals} Appeals pending > 24h`, 
            action: 'Resolve Now',
            icon: AlertTriangle 
        },
        { 
            id: 2, 
            level: 'WARNING', 
            msg: 'Low participation in "Math Ch3" Exam (40%)', 
            action: 'Check Difficulty',
            icon: FileWarning 
        },
        { 
            id: 3, 
            level: 'INFO', 
            msg: 'High Inactivity detected in Class 10', 
            action: 'Send Notify',
            icon: Users 
        }
    ];

    const handleRefresh = () => {
        setIsLoading(true);
        setTimeout(() => {
            setRefreshKey(prev => prev + 1);
            setIsLoading(false);
        }, 800);
    };

    const MetricCard = ({ title, value, sub, trend, color, icon: Icon }: any) => (
        <Card className={`relative overflow-hidden border-l-4 ${color}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg bg-slate-50`}>
                    <Icon size={24} className="text-slate-400" />
                </div>
            </div>
            
            <div className="mt-4 flex items-center text-sm">
                {trend === 'up' ? (
                    <span className="text-emerald-600 font-bold flex items-center bg-emerald-50 px-1.5 py-0.5 rounded mr-2">
                        <ArrowUpRight size={14} className="mr-1" /> +12%
                    </span>
                ) : trend === 'down' ? (
                     <span className="text-red-500 font-bold flex items-center bg-red-50 px-1.5 py-0.5 rounded mr-2">
                        <ArrowDownRight size={14} className="mr-1" /> -5%
                    </span>
                ) : null}
                <span className="text-slate-400">{sub}</span>
            </div>
        </Card>
    );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                <Activity className="mr-3 text-indigo-600" /> Platform Health Monitor
            </h1>
            <p className="text-slate-500 text-sm mt-1">
                System Status: <span className="font-bold text-emerald-600">Healthy (98.2% Uptime)</span>
            </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex gap-3">
             <Button 
                variant="outline" 
                className="text-sm flex items-center min-w-[130px] justify-center" 
                onClick={handleRefresh}
                disabled={isLoading}
             >
                {isLoading ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                    <RefreshCw size={16} className="mr-2" />
                )}
                {isLoading ? "Updating..." : "Refresh Data"}
            </Button>
            {onLogout && (
                <Button variant="secondary" onClick={onLogout} className="flex items-center text-sm bg-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600">
                    <LogOut size={16} className="mr-2" /> Logout
                </Button>
            )}
        </div>
      </div>

      {/* SECTION 1: PLATFORM HEALTH SNAPSHOT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
            title="Total Users" 
            value={intelligence.totalUsers} 
            sub="Active Database"
            trend="up"
            color="border-indigo-500"
            icon={Users}
        />
        <MetricCard 
            title="Active (7d)" 
            value={intelligence.activeUsers} 
            sub="Engaged Users"
            trend="up"
            color="border-emerald-500"
            icon={Zap}
        />
        <MetricCard 
            title="Churn Risk" 
            value={intelligence.churnRiskCount} 
            sub="Inactive > 14 days"
            trend="down"
            color="border-red-500"
            icon={AlertTriangle}
        />
         <MetricCard 
            title="Health Score" 
            value={`${intelligence.healthScore}%`} 
            sub="Retention Metric"
            trend="up"
            color="border-purple-500"
            icon={Activity}
        />
      </div>

      {/* SECTION 1.5: TRAFFIC ANALYTICS (24H & MONTHLY) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center">
                      <Globe size={18} className="mr-2 text-blue-500" /> 24-Hour Traffic
                  </h3>
                  <Badge color="bg-blue-100 text-blue-700">Today: 1,412 Hits</Badge>
              </div>
              <div className="h-48 w-full">
                  <div className="flex-1 min-h-0 h-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <AreaChart data={traffic24hData}>
                          <defs>
                              <linearGradient id="colorTraffic24" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="time" fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff' }}
                          />
                          <Area type="monotone" dataKey="visitors" stroke="#3b82f6" fill="url(#colorTraffic24)" strokeWidth={3} />
                      </AreaChart>
                  </ResponsiveContainer>
                  </div>
              </div>
          </Card>

          <Card>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center">
                      <BarChart2 size={18} className="mr-2 text-purple-500" /> Monthly Traffic
                  </h3>
                  <Badge color="bg-purple-100 text-purple-700">Total: 11,800 Hits</Badge>
              </div>
              <div className="h-48 w-full">
                  <div className="flex-1 min-h-0 h-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={trafficMonthlyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="week" fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip 
                             cursor={{fill: 'transparent'}}
                             contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff' }} 
                          />
                          <Bar dataKey="visitors" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                  </ResponsiveContainer>
                  </div>
              </div>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SECTION 2: TRENDS & ENGAGEMENT (2/3 Width) */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* User Growth Chart */}
            <Card className="h-80 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-slate-800">User Growth & Activity</h3>
                        <p className="text-xs text-slate-400">New registrations vs Active users (Last 7 days)</p>
                    </div>
                    <Badge color="bg-indigo-50 text-indigo-600">Weekly View</Badge>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <AreaChart data={growthData}>
                            <defs>
                                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                            <Tooltip />
                            <Area type="monotone" dataKey="activeUsers" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" name="Active Users" />
                            <Area type="monotone" dataKey="newUsers" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorNew)" name="New Regs" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>

        {/* SECTION 3: ACTION QUEUE & INSIGHTS (1/3 Width) */}
        <div className="space-y-6">
            
            {/* 1. Admin Action Queue */}
            <Card className="bg-white border border-slate-200 shadow-md">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center">
                        <Zap className="mr-2 text-amber-500" size={18} /> Action Queue
                    </h3>
                    <Badge color="bg-red-100 text-red-700">{alerts.length} Pending</Badge>
                </div>
                
                <div className="space-y-3">
                    {alerts.map(alert => (
                        <div key={alert.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 group hover:border-indigo-300 transition-colors">
                            <div className="flex items-start space-x-3">
                                <alert.icon size={18} className={`mt-0.5 ${alert.level === 'CRITICAL' ? 'text-red-500' : alert.level === 'WARNING' ? 'text-amber-500' : 'text-blue-500'}`} />
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 leading-tight">{alert.msg}</p>
                                    <button className="text-xs font-bold text-indigo-600 mt-2 hover:underline flex items-center">
                                        {alert.action} <ArrowRight size={10} className="ml-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* 2. Problematic Content Insight */}
            <Card>
                <h3 className="font-bold text-slate-800 mb-4">Exam Insights</h3>
                <div className="h-48 w-full">
                  <div className="flex-1 min-h-0 h-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={examPerformanceData} layout="vertical" barSize={12}>
                             <XAxis type="number" hide />
                             <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} />
                             <Tooltip cursor={{fill: 'transparent'}} />
                             <Legend wrapperStyle={{fontSize: '10px'}} />
                             <Bar dataKey="participation" name="Partic. %" fill="#818cf8" radius={[0, 4, 4, 0]} />
                             <Bar dataKey="avgScore" name="Avg Score" fill="#34d399" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                </div>
            </Card>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;