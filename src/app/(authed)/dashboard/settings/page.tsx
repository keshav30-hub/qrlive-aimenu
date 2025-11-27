
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit, Save, X, Upload, Fingerprint, RefreshCw, Crown, ExternalLink, Instagram, Globe, Eye, EyeOff, Loader2, Download, QrCode } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseStorage } from '@/firebase/storage/use-firebase-storage';

type BusinessInfo = {
  name: string;
  owner: string;
  contact: string;
  email: string;
  address: string;
  phone?: string;
  logo: string;
  logoStoragePath?: string;
  googleReviewLink?: string;
  instagramLink?: string;
  adminAccessCode?: string;
  businessId?: string;
};

type StaffMember = {
    id: string;
    accessCode?: string;
};

export default function SettingsPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const { uploadFile, deleteFile, isLoading: isUploading } = useFirebaseStorage();
  
  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const staffRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'staff') : null, [firestore, user]);

  const { data: businessInfo, isLoading: isInfoLoading } = useDoc<BusinessInfo>(userRef);
  const { data: staffList } = useCollection<StaffMember>(staffRef);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedInfo, setEditedInfo] = useState<BusinessInfo | null>(null);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);
  
  useEffect(() => {
    if (businessInfo) {
      setEditedInfo(businessInfo);
    }
  }, [businessInfo]);


  const handleEdit = () => {
    if (businessInfo) {
      setEditedInfo(businessInfo);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAccessCodeError(null);
  };
  
  const isAccessCodeUnique = async (code: string) => {
    if (!user || !staffRef) return false;

    // Check against other staff members
    const staffQuery = query(staffRef, where("accessCode", "==", code));
    const staffSnapshot = await getDocs(staffQuery);

    return staffSnapshot.empty;
  };

  const handleSave = async () => {
    if (!userRef || !editedInfo) return;
    
    // Validate Access Code
    if (editedInfo.adminAccessCode) {
        if (!/^\d{6}$/.test(editedInfo.adminAccessCode)) {
            setAccessCodeError("Access code must be a 6-digit number.");
            return;
        }
        const isUnique = await isAccessCodeUnique(editedInfo.adminAccessCode);
        if (!isUnique) {
            setAccessCodeError("This access code is already in use by a staff member.");
            return;
        }
    }
    setAccessCodeError(null);

    setIsSaving(true);
    try {
      await updateDoc(userRef, { ...editedInfo });
      toast({ title: 'Success', description: 'Business info updated.'});
      setIsEditing(false);
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save changes.' });
      console.error(e);
    } finally {
        setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'adminAccessCode') {
        setAccessCodeError(null);
    }
    setEditedInfo(prev => prev ? ({ ...prev, [name]: value }) : null);
  };
  
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user && editedInfo) {
      const file = e.target.files[0];
      const newLogoPath = `users/${user.uid}/images/logo/${file.name}`;
      
      const uploadResult = await uploadFile(newLogoPath, file);
      
      if (uploadResult) {
        if (editedInfo.logoStoragePath) {
          await deleteFile(editedInfo.logoStoragePath);
        }
        
        setEditedInfo(prev => prev ? ({ 
          ...prev, 
          logo: uploadResult.downloadURL,
          logoStoragePath: uploadResult.storagePath
        }) : null);
      } else {
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload new logo.' });
      }
    }
  };
  
  const generateAndDownloadQr = (url: string, filename: string) => {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}`;
    
    fetch(qrApiUrl)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        toast({ title: 'QR Code Downloading', description: `Your ${filename} has started downloading.` });
      })
      .catch(() => {
        window.open(qrApiUrl, '_blank');
        toast({ title: 'QR Code Ready', description: 'Your QR code has been opened in a new tab.' });
      });
  };

  const handleDownloadAttendanceQr = () => {
    const attendanceUrl = `${window.location.origin}/dashboard/attendance`;
    generateAndDownloadQr(attendanceUrl, 'attendance-qr-code.png');
  };

  const handleDownloadCaptainQr = () => {
    const captainUrl = `${window.location.origin}/dashboard/captain`;
    generateAndDownloadQr(captainUrl, 'captain-login-qr-code.png');
  };


  if (isInfoLoading) {
    return <div className="flex h-screen items-center justify-center">Loading settings...</div>;
  }

  if (!businessInfo || !editedInfo) {
    return <div className="flex h-screen items-center justify-center">Could not load business information.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Fingerprint className="h-5 w-5" />
                    Business ID
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-center">
                    {businessInfo.businessId || 'N/A'}
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <RefreshCw className="h-5 w-5" />
                    Data Sync
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Last synced: Just now</p>
                <Button className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" /> Sync Now
                </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Crown className="h-5 w-5" />
                    Subscription
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p className="font-semibold">Pro Plan <span className="text-xs font-normal text-muted-foreground">(Renews on 24 Dec 2024)</span></p>
                 <Link href="#" className="w-full">
                    <Button variant="outline" className="w-full">
                        Manage Subscription
                        <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Business Info</CardTitle>
            <CardDescription>Manage your business details.</CardDescription>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving || isUploading}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || isUploading}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={editedInfo.logo || 'https://picsum.photos/seed/logo/100/100'} alt="Business Logo" />
                <AvatarFallback>
                  {businessInfo.name ? businessInfo.name.charAt(0) : 'B'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute bottom-0 right-0">
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90">
                     {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </div>
                    <Input id="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoChange} disabled={isUploading} />
                  </Label>
                </div>
              )}
            </div>
            <div className="grid gap-1 flex-1">
              <Label className="text-sm text-muted-foreground">Business Name</Label>
              {isEditing ? (
                <Input name="name" value={editedInfo.name} onChange={handleInputChange} className="text-2xl font-bold p-0 border-0 shadow-none focus-visible:ring-0" />
              ) : (
                <p className="text-2xl font-bold">{businessInfo.name}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label htmlFor="owner">Owner Name</Label>
              {isEditing ? (
                <Input id="owner" name="owner" value={editedInfo.owner} onChange={handleInputChange} />
              ) : (
                <p className="font-medium">{businessInfo.owner}</p>
              )}
            </div>
             <div className="space-y-1">
              <Label htmlFor="email">Email ID</Label>
              {isEditing ? (
                <Input id="email" name="email" type="email" value={editedInfo.email} onChange={handleInputChange} />
              ) : (
                <p className="font-medium">{businessInfo.email}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="contact">Contact Number</Label>
              {isEditing ? (
                <Input id="contact" name="contact" value={editedInfo.contact} onChange={handleInputChange} />
              ) : (
                <p className="font-medium">{businessInfo.contact}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Business Phone Number (Optional)</Label>
              {isEditing ? (
                <Input id="phone" name="phone" value={editedInfo.phone || ''} onChange={handleInputChange} />
              ) : (
                <p className="font-medium">{businessInfo.phone || '-'}</p>
              )}
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="address">Full Address</Label>
               {isEditing ? (
                <Textarea id="address" name="address" value={editedInfo.address} onChange={handleInputChange} />
              ) : (
                <p className="font-medium">{businessInfo.address}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="googleReviewLink">Google Review Link</Label>
               {isEditing ? (
                <Input id="googleReviewLink" name="googleReviewLink" value={editedInfo.googleReviewLink || ''} onChange={handleInputChange} />
              ) : (
                <p className="font-medium">{businessInfo.googleReviewLink || '-'}</p>
              )}
            </div>
             <div className="space-y-1">
              <Label htmlFor="instagramLink">Instagram Link</Label>
               {isEditing ? (
                <Input id="instagramLink" name="instagramLink" value={editedInfo.instagramLink || ''} onChange={handleInputChange} />
              ) : (
                <p className="font-medium">{businessInfo.instagramLink || '-'}</p>
              )}
            </div>
             <div className="space-y-1">
              <Label htmlFor="adminAccessCode">Admin Access Code</Label>
              {isEditing ? (
                <div>
                    <div className="relative">
                        <Input 
                            id="adminAccessCode" 
                            name="adminAccessCode" 
                            type={showAccessCode ? 'text' : 'password'} 
                            value={editedInfo.adminAccessCode || ''} 
                            onChange={handleInputChange}
                            maxLength={6}
                            pattern="\d{6}"
                        />
                        <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowAccessCode(!showAccessCode)}>
                            {showAccessCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                    {accessCodeError && <p className="text-sm text-destructive mt-1">{accessCodeError}</p>}
                </div>
              ) : (
                <p className="font-medium">{businessInfo.adminAccessCode ? '••••••' : 'Not set'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <QrCode className="h-5 w-5" />
                    Attendance QR Code
                </CardTitle>
                <CardDescription>Download a QR code for your staff attendance login page.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full" onClick={handleDownloadAttendanceQr}>
                    <Download className="mr-2 h-4 w-4" />
                    Download QR (PNG)
                </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <QrCode className="h-5 w-5" />
                    Captain Login QR Code
                </CardTitle>
                <CardDescription>Download a QR code for your captain task management page.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full" onClick={handleDownloadCaptainQr}>
                    <Download className="mr-2 h-4 w-4" />
                    Download QR (PNG)
                </Button>
            </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Raise a Ticket</CardTitle>
            <CardDescription>Get help with any issues you're facing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="ticket-type">Support Ticket Type</Label>
              <Select>
                <SelectTrigger id="ticket-type">
                  <SelectValue placeholder="Select a ticket type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="billing">Billing Inquiry</SelectItem>
                  <SelectItem value="feedback">General Feedback</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-description">Description</Label>
              <Textarea id="ticket-description" placeholder="Please describe your issue in detail..." rows={5} />
            </div>
            <Button className="w-full">Submit Ticket</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Customer Support</CardTitle>
            <CardDescription>Contact us directly for immediate assistance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email ID</Label>
              <p className="font-medium">support@qrlive.menu</p>
            </div>
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <p className="font-medium">+91 12345 67890</p>
            </div>
            <div className="flex gap-2 pt-2">
                <Button variant="outline" size="icon" asChild>
                    <Link href={businessInfo?.instagramLink || '#'} target="_blank">
                        <Instagram className="h-5 w-5" />
                    </Link>
                </Button>
                 <Button variant="outline" size="icon" asChild>
                    <Link href="#" target="_blank">
                        <Globe className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

    