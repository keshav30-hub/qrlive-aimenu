
'use client';

import { useState, useMemo } from 'react';
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
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type TableData = {
  id: string;
  name: string;
}

type UserProfile = {
    businessId?: string;
}

const topPages = [
  { name: 'N/A', visits: 0 },
];

export default function SetupQrMenuPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const tablesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tables') : null, [firestore, user]);
  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);

  const { data: tablesData, isLoading: tablesLoading } = useCollection<TableData>(tablesRef);
  const { data: userProfile } = useDoc<UserProfile>(userRef);

  const tables = tablesData || [];

  const [newTableName, setNewTableName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const businessId = userProfile?.businessId;


  const handleAddTable = async () => {
    if (newTableName.trim() && tablesRef) {
      try {
        await addDoc(tablesRef, { name: newTableName });
        toast({ title: "Success", description: "Table added." });
        setNewTableName('');
        setIsDialogOpen(false);
      } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not add table." });
        console.error(e);
      }
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!tablesRef) return;
    try {
      await deleteDoc(doc(tablesRef, id));
      toast({ title: "Success", description: "Table deleted." });
    } catch(e) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete table." });
      console.error(e);
    }
  };
  
  const handleDownloadQr = (tableName: string) => {
    if (!businessId) {
        toast({ variant: "destructive", title: "Error", description: "Business ID not found." });
        return;
    }
    const tableSlug = tableName.toLowerCase().replace(/ /g, '-');
    const menuUrl = `${window.location.origin}/qrmenu/${businessId}/${tableSlug}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
      menuUrl
    )}`;
    
    // To download the QR code, we can create a temporary link and click it.
    const link = document.createElement('a');
    link.href = qrApiUrl;
    // We fetch the image and create a blob URL to enable cross-origin download.
    fetch(qrApiUrl)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        link.href = blobUrl;
        link.download = `${tableName.replace(/ /g, '_')}-qr-code.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {
        // Fallback for if fetching fails (e.g., CORS issues in some environments)
        // This will open the QR code in a new tab instead of downloading directly.
        window.open(qrApiUrl, '_blank');
      });
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
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Analytics data not available</p>
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
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Analytics data not available</p>
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
          {tablesLoading ? <p>Loading tables...</p> : (
          <>
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
                      <Link href={`/qrmenu/${businessId}/${table.name.toLowerCase().replace(/ /g, '-')}`} target="_blank">
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
              {tables.length === 0 && !tablesLoading && (
                  <div className="text-center py-10 text-muted-foreground">
                      <p>No tables added yet. Click &quot;Add Table&quot; to get started.</p>
                  </div>
              )}
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
