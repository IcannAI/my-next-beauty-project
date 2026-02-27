import { prisma } from '@/infrastructure/db/prisma';
import { requireAdmin } from '@/infrastructure/auth/rbac';
import { Badge } from '@/components/ui/badge';
import { UserActions } from './UserActions';
import { redirect } from 'next/navigation';

export default async function AdminUsersPage() {
  const guard = await requireAdmin();
  if (guard) redirect('/');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-end justify-between border-l-4 border-blue-500 pl-6 py-2">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">用戶權限管理</h1>
            <p className="mt-2 text-gray-500 font-medium">查看並調整所有系統用戶的權限與狀態。</p>
          </div>
        </header>

        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Email</th>
                <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Name</th>
                <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Role</th>
                <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Joined At</th>
                <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-8 py-6 font-bold text-gray-900">{user.email}</td>
                  <td className="px-8 py-6 text-gray-600 font-medium">{user.name || '-'}</td>
                  <td className="px-8 py-6">
                    <Badge className={
                      user.role === 'ADMIN' ? 'bg-purple-500 text-white' :
                      user.role === 'KOL' ? 'bg-rose-500 text-white' :
                      'bg-blue-500 text-white'
                    }>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant="outline" className={user.banned ? 'text-red-500 border-red-100 bg-red-50' : 'text-green-500 border-green-100 bg-green-50'}>
                      {user.banned ? 'Banned' : 'Active'}
                    </Badge>
                  </td>
                  <td className="px-8 py-6 text-sm text-gray-400 font-bold uppercase">
                    {new Date(user.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-8 py-6">
                    <UserActions user={user as any} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
