'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit, Save, X, Upload, Fingerprint, RefreshCw, Crown, ExternalLink, Instagram, Globe } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const initialBusinessInfo = {
  name: 'The Gourmet Place',
  owner: 'John Doe',
  contact: '+91 98765 43210',
  email: 'contact@thegourmetplace.com',
  address: '123, Gourmet Lane, Foodie City, 400001',
  phone: '+022 1234 5678',
  logo: 'https://picsum.photos/seed/logo/100/100',
  googleReviewLink: 'https://g.page/r/your-review-link',
};

export default function SettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(initialBusinessInfo);
  const [editedInfo, setEditedInfo] = useState(initialBusinessInfo);

  const handleEdit = () => {
    setEditedInfo(businessInfo);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    setBusinessInfo(editedInfo);
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedInfo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedInfo(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

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
                    B-10X2001
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
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
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
                <AvatarImage src={isEditing ? editedInfo.logo : businessInfo.logo} alt="Business Logo" />
                <AvatarFallback>
                  {businessInfo.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute bottom-0 right-0">
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90">
                      <Upload className="h-4 w-4" />
                    </div>
                    <Input id="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoChange} />
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
                <Input id="phone" name="phone" value={editedInfo.phone} onChange={handleInputChange} />
              ) : (
                <p className="font-medium">{businessInfo.phone}</p>
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
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="googleReviewLink">Google Review Link</Label>
               {isEditing ? (
                <Input id="googleReviewLink" name="googleReviewLink" value={editedInfo.googleReviewLink} onChange={handleInputChange} />
              ) : (
                <p className="font-medium">{businessInfo.googleReviewLink}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
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
                    <Link href="#" target="_blank">
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
