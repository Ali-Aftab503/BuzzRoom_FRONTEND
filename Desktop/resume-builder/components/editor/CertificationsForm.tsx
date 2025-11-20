/**
 * Certifications Form Component
 * Dynamic list with add/edit/remove functionality
 */

'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Plus, Award } from 'lucide-react';

export function CertificationsForm() {
  const { resumeData, updateCertification, addCertification, removeCertification } = useResumeStore();
  const { certifications } = resumeData;

  return (
    <div className="space-y-4">
      {!certifications || certifications.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No certifications added yet</p>
          <p className="text-xs mt-1">Click the button below to add your credentials</p>
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={[certifications[0]?.id]} className="space-y-3">
          {certifications.map((cert, index) => (
            <AccordionItem
              key={cert.id}
              value={cert.id}
              className="border rounded-md px-3 bg-white"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-2 text-left">
                    <Award className="w-4 h-4 text-slate-500" />
                    <span className="font-medium">
                      {cert.name || `Certification ${index + 1}`}
                      {cert.issuer && ` • ${cert.issuer}`}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-3">
                <div className="space-y-4">
                  {/* Certification Name */}
                  <div className="space-y-2">
                    <Label htmlFor={`cert-name-${cert.id}`}>Certification Name *</Label>
                    <Input
                      id={`cert-name-${cert.id}`}
                      value={cert.name}
                      onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
                      placeholder="AWS Certified Solutions Architect"
                    />
                  </div>

                  {/* Issuing Organization */}
                  <div className="space-y-2">
                    <Label htmlFor={`cert-issuer-${cert.id}`}>Issuing Organization *</Label>
                    <Input
                      id={`cert-issuer-${cert.id}`}
                      value={cert.issuer}
                      onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                      placeholder="Amazon Web Services"
                    />
                  </div>

                  {/* Issue Date and Expiry Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`cert-date-${cert.id}`}>Issue Date *</Label>
                      <Input
                        id={`cert-date-${cert.id}`}
                        type="month"
                        value={cert.date}
                        onChange={(e) => updateCertification(cert.id, { date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`cert-expiry-${cert.id}`} className="text-slate-600">
                        Expiry Date (Optional)
                      </Label>
                      <Input
                        id={`cert-expiry-${cert.id}`}
                        type="month"
                        value={cert.expiryDate || ''}
                        onChange={(e) => updateCertification(cert.id, { expiryDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Credential ID and Link */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`cert-credential-${cert.id}`} className="text-slate-600">
                        Credential ID (Optional)
                      </Label>
                      <Input
                        id={`cert-credential-${cert.id}`}
                        value={cert.credentialId || ''}
                        onChange={(e) => updateCertification(cert.id, { credentialId: e.target.value })}
                        placeholder="CERT-123456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`cert-link-${cert.id}`} className="text-slate-600">
                        Verification Link (Optional)
                      </Label>
                      <Input
                        id={`cert-link-${cert.id}`}
                        type="url"
                        value={cert.link || ''}
                        onChange={(e) => updateCertification(cert.id, { link: e.target.value })}
                        placeholder="https://verify.example.com"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="pt-2 border-t">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to remove this certification?')) {
                          removeCertification(cert.id);
                        }
                      }}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove This Certification
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Add New Certification Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addCertification}
        className="w-full border-dashed border-2 hover:border-slate-400 hover:bg-slate-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Certification
      </Button>

      {/* Helper Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Pro Tips:</p>
        <ul className="text-xs space-y-1 ml-4 list-disc">
          <li>Include industry-recognized certifications relevant to your field</li>
          <li>Add verification links to make it easy for employers to confirm</li>
          <li>List certifications in order of relevance or recency</li>
        </ul>
      </div>
    </div>
  );
}