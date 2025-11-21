'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  Smartphone,
  BarChart,
  PlusCircle,
  Download,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

const initialTables = [
  { id: 1, name: 'Table 1' },
  { id: 2, name: 'Table 2' },
  { id: 3, name: 'Table 3' },
  { id: 4, name: 'Table 4' },
  { id: 5, name: 'Table 5' },
];

const topPages = [
  { name: '/menu/starters', visits: 1024 },
  { name: '/menu/main-course', visits: 980 },
  { name: '/offers', visits: 750 },
  { name: '/cart', visits: 500 },
];

export default function SetupQrMenuPage() {
  const [tables, setTables] = useState(initialTables);
  const [newTableName, setNewTableName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddTable = () => {
    if (newTableName.trim()) {
      const newTable = {
        id: tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1,
        name: newTableName,
      };
      setTables([...tables, newTable]);
      setNewTableName('');
      setIsDialogOpen(false);
    }
  };

  const handleDeleteTable = (id: number) => {
    setTables(tables.filter(table => table.id !== id));
  };
  
  const handleDownloadQr = (tableName: string) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
      `https://your-restaurant.com/menu?table=${tableName}`
    )}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tableName.replace(/ /g, '_')}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">QR Menu Analytics & Management</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Currently browsing the menu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Visitors (Today)
            </CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+235</div>
            <p className="text-xs text-muted-foreground">+12.1% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Visited Pages</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                {topPages.map(page => (
                    <div key={page.name} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-muted-foreground truncate">{page.name}</span>
                        <span className="font-bold">{page.visits}</span>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Table Management</CardTitle>
            <CardDescription>
              Create and manage QR codes for your tables.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
                <DialogDescription>
                  Enter a name for the new table to generate a unique QR code.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="table-name" className="text-right">
                    Table Name
                  </Label>
                  <Input
                    id="table-name"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., Table 1 or T1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTable}>Save Table</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Table Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table, index) => (
                <TableRow key={table.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{table.name}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadQr(table.name)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download QR
                    </Button>
                    <Link href="/qrmenu/the-gourmet-place/1" target="_blank">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visit
                      </Button>
                    </Link>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteTable(table.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            {tables.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    <p>No tables added yet. Click &quot;Add Table&quot; to get started.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
