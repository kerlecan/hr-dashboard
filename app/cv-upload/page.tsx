'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, FileText, User, Mail, Phone, Calendar,
  Briefcase, GraduationCap, Code, Globe, Award,
  CheckCircle, Edit2, Save, X, Loader2,
  AlertCircle, ChevronRight, ChevronLeft,
  Download, Eye, Trash2, Shield, Plus, Sparkles,
  FileUp, Star, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function CVUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');

  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    birthdate: '',
    summary: '',
    currentTitle: '',
    totalExperience: 0,
    language: 'TR',
    parseScore: 0,
    pdfPath: '',
    education: [] as Array<{ school: string; degree: string; department: string; startDate?: string; endDate?: string }>,
    experience: [] as Array<{ company: string; title: string; startDate: string; endDate: string; isCurrent: boolean; description: string }>,
    skills: [] as Array<{ name: string; level: string }>,
    languages: [] as Array<{ name: string; level: string }>,
    certificates: [] as any[],
  });

  // === FILE UPLOAD HANDLER ===
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Lütfen sadece PDF dosyası yükleyin.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Dosya boyutu 10MB\'dan büyük olamaz.');
      return;
    }

    setFile(selectedFile);
    setError('');
    setProgress(10);

    // Otomatik analiz
    await parsePDF(selectedFile);
  };

  // === PDF PARSING LOGIC ===
  const parsePDF = async (pdfFile: File) => {
    setLoading(true);
    setStep(2);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      const arrayBuffer = await pdfFile.arrayBuffer();
      setProgress(30);

      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setProgress(50);

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      setRawText(fullText);
      setProgress(80);

      const parsed = analyzeCVText(fullText);
      parsed.pdfPath = `uploads/${Date.now()}_${pdfFile.name}`;

      setParsedData(parsed);
      setFormData(parsed);
      setProgress(100);

      setTimeout(() => {
        setStep(3);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error('PDF parse error:', err);
      setError('PDF okunamadı. Lütfen manuel giriş yapın.');
      const emptyData = {
        fullname: '',
        email: '',
        phone: '',
        birthdate: '',
        summary: '',
        currentTitle: '',
        totalExperience: 0,
        language: 'TR',
        parseScore: 0,
        pdfPath: `uploads/${Date.now()}_${pdfFile.name}`,
        education: [],
        experience: [],
        skills: [],
        languages: [{ name: 'Türkçe', level: 'Ana dil' }],
        certificates: [],
      };
      setFormData(emptyData);
      setStep(3);
      setLoading(false);
    }
  };

  // === TEXT ANALYSIS FOR TURKISH CV STRUCTURE ===
  const analyzeCVText = (text: string) => {
    // Normalize spacing and fix common OCR issues
    let normalized = text
      .replace(/\s+/g, ' ')
      .replace(/([a-zA-ZçğıöşüÇĞİÖŞÜ])(\d)/g, '$1 $2')
      .replace(/(\d)([a-zA-ZçğıöşüÇĞİÖŞÜ])/g, '$1 $2')
      .replace(/·/g, ' · ')
      .replace(/\)/g, ') ')
      .replace(/\(/g, ' (')
      .trim();

    // === KİŞİSEL BİLGİLER ===
    const nameMatch = normalized.match(/^([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)/);
    const fullname = nameMatch ? `${nameMatch[1]} ${nameMatch[2]}` : '';

    const phoneMatch = normalized.match(/(\+90|\b0)?\s*\d{3}[\s.)-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}/);
    const rawPhone = phoneMatch?.[0] || '';
    const digitsOnly = rawPhone.replace(/\D/g, '');
    const phone =
      digitsOnly.startsWith('90') ? `+${digitsOnly}` :
      digitsOnly.startsWith('0') ? `+90${digitsOnly.slice(1)}` :
      digitsOnly ? `+90${digitsOnly}` : '';

    const emailMatch = normalized.match(/[\w.-]+@[\w.-]+\.\w+/);
    const birthdateMatch = normalized.match(/Doğum Tarihi:\s*(\d{4})\s*\(?(\d+)\s*Yaş\)?/);

    // === ÖZET ===
    let summary = '';
    const ozgecmisStart = normalized.indexOf('Özgeçmiş Özeti');
    const isDeneyimStart = normalized.indexOf('İş Deneyimleri');
    if (ozgecmisStart !== -1 && isDeneyimStart !== -1) {
      summary = normalized
        .substring(ozgecmisStart + 'Özgeçmiş Özeti'.length, isDeneyimStart)
        .replace(/Bursa, Osmangazi/g, '')
        .trim()
        .replace(/\s+/g, ' ');
    }

    // === İŞ DENEYİMLERİ (GÜVENİLİR VERSİYON) ===
    const experience: Array<{
      company: string;
      title: string;
      startDate: string;
      endDate: string;
      isCurrent: boolean;
      description: string;
    }> = [];

    const expSectionStart = normalized.indexOf('İş Deneyimleri');
    const expSectionEnd = normalized.indexOf('Eğitim Bilgileri');
    if (expSectionStart !== -1 && expSectionEnd !== -1) {
      const expBlock = normalized.substring(expSectionStart + 'İş Deneyimleri'.length, expSectionEnd).trim();
      const tokens = expBlock.split(/(\s*\S+\s*)/).filter(t => t.trim());

      const entries: { title: string; companyLine: string; desc: string }[] = [];
      let i = 0;
      while (i < tokens.length) {
        const current = tokens[i].trim();
        if (current.includes('·(')) {
          const companyLine = current;
          const title = i > 0 ? tokens[i - 1]?.trim() || '' : '';
          let desc = '';
          let j = i + 1;
          while (j < tokens.length && tokens[j].startsWith('')) {
            desc += tokens[j].replace('', '').trim() + ' ';
            j++;
          }
          if (title && companyLine) {
            entries.push({ title, companyLine, desc: desc.trim() });
          }
          i = j;
        } else {
          i++;
        }
      }

      for (const entry of entries) {
        const { title, companyLine, desc } = entry;
        const dateMatch = companyLine.match(/·\s*\(\s*([^)]+)\s*\)/);
        let company = companyLine.replace(/·.*/, '').trim();
        let startDate = '', endDate = '', isCurrent = false;

        if (dateMatch) {
          const dateStr = dateMatch[1].trim();
          const parts = dateStr.split('-').map(p => p.trim());
          startDate = parts[0] || '';
          const endPart = parts[1] || '';
          if (endPart.toLowerCase().includes('devam')) {
            isCurrent = true;
            endDate = '';
          } else {
            endDate = endPart;
          }
        }

        experience.push({
          title,
          company,
          startDate,
          endDate,
          isCurrent,
          description: desc
        });
      }
    }

    // === EĞİTİM BİLGİLERİ ===
    const education: Array<{ school: string; degree: string; department: string; startDate: string; endDate: string }> = [];

    const eduSectionStart = normalized.indexOf('Eğitim Bilgileri');
    const techSkillsStart = normalized.indexOf('Teknik Beceriler');
    if (eduSectionStart !== -1 && techSkillsStart !== -1) {
      const eduBlock = normalized.substring(eduSectionStart + 'Eğitim Bilgileri'.length, techSkillsStart).trim();
      const eduLines = eduBlock.split('\n').filter(l => l.trim());

      for (const line of eduLines) {
        if (line.includes('·') && line.includes('(') && line.includes('-')) {
          const [preDate, postDate] = line.split('(');
          const schoolDept = preDate.replace('·', '').trim();
          const datePart = postDate.split(')')[0].trim();

          const [school, deptPart] = schoolDept.split('·').map(s => s.trim());
          const department = deptPart || '';

          const [start, end] = datePart.split('-').map(d => d.trim());

          education.push({
            school: school || '',
            department: department || '',
            degree: 'Lisans Derecesi',
            startDate: start || '',
            endDate: end || ''
          });
        }
      }
    }

    // === TEKNİK BECERİLER ===
    const skills: Array<{ name: string; level: string }> = [];
    const skillSectionStart = normalized.indexOf('Teknik Beceriler');
    const langSectionStart = normalized.indexOf('Diller');
    if (skillSectionStart !== -1 && langSectionStart !== -1) {
      const skillBlock = normalized.substring(skillSectionStart + 'Teknik Beceriler'.length, langSectionStart);
      const skillItems = skillBlock.split('').slice(1).map(s => s.trim()).filter(Boolean);

      skillItems.forEach(item => {
        const match = item.match(/^(.+?)\((İleri|Orta|Başlangıç|Uzman)\)$/);
        if (match) {
          const rawName = match[1].trim();
          const level = match[2];
          if (rawName.includes(':')) {
            const [_cat, tools] = rawName.split(':').map(x => x.trim());
            const toolList = tools.split(',').map(t => t.trim());
            toolList.forEach(tool => {
              const tMatch = tool.match(/^(.+?)\((İleri|Orta|Başlangıç|Uzman)\)$/);
              if (tMatch) {
                skills.push({ name: tMatch[1].trim(), level: tMatch[2] });
              } else {
                skills.push({ name: tool, level: 'Orta' });
              }
            });
          } else {
            skills.push({ name: rawName, level });
          }
        } else if (item.includes(':')) {
          const [_cat, tools] = item.split(':').map(x => x.trim());
          const toolList = tools.split(',').map(t => t.trim());
          toolList.forEach(tool => {
            skills.push({ name: tool.replace(/\(.*?\)/g, '').trim(), level: 'Orta' });
          });
        }
      });
    }

    // === DİLLER ===
    const languages: Array<{ name: string; level: string }> = [];
    const langSection = normalized.substring(langSectionStart + 'Diller'.length).trim();
    const langItems = langSection.split('').slice(1).map(l => l.trim()).filter(Boolean);
    langItems.forEach(item => {
      const match = item.match(/^(.+?)\((Ana dil|İleri|Orta|Başlangıç)\)$/);
      if (match) {
        languages.push({ name: match[1].trim(), level: match[2] });
      }
    });

    // === PARSE SKORU ===
    let parseScore = 0;
    if (fullname) parseScore += 20;
    if (emailMatch) parseScore += 15;
    if (phone) parseScore += 15;
    if (summary) parseScore += 10;
    if (experience.length > 0) parseScore += 15;
    if (education.length > 0) parseScore += 10;
    if (skills.length > 0) parseScore += 10;
    if (languages.length > 0) parseScore += 5;
    parseScore = Math.min(parseScore, 100);

    return {
      fullname,
      email: emailMatch?.[0] || '',
      phone,
      birthdate: birthdateMatch ? `${birthdateMatch[1]} (${birthdateMatch[2]} Yaş)` : '',
      summary,
      currentTitle: experience.length > 0 ? experience[0].title : '',
      totalExperience: experience.length,
      language: languages.some(l => l.name === 'İngilizce') ? 'EN' : 'TR',
      parseScore,
      pdfPath: '',
      education,
      experience,
      skills,
      languages,
      certificates: [],
    };
  };

  // === FORM UTILS ===
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field: string, index: number, key: string, value: any) => {
    setFormData(prev => {
      const newArray = [...(prev as any)[field]];
      newArray[index] = { ...newArray[index], [key]: value };
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field: string, item: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev as any)[field], item]
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev as any)[field].filter((_: any, i: number) => i !== index)
    }));
  };

  // === SUBMIT ===
  const submitCV = async () => {
    if (!formData.fullname.trim()) {
      setError('Ad Soyad alanı zorunludur.');
      return;
    }
    if (!formData.email.trim()) {
      setError('E-posta alanı zorunludur.');
      return;
    }

    setLoading(true);
    setStep(4);
    setError('');

    try {
      const payload = {
        cv: formData,
        education: formData.education,
        experience: formData.experience,
        skills: formData.skills,
        languages: formData.languages,
        certificates: formData.certificates,
      };

      const response = await fetch('/api/mobil-user/cv/submit?dbName=HOMINUM', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-db-name': 'HOMINUM'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('CV başarıyla kaydedildi! Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => router.push('/'), 2500);
      } else {
        setError(result.message || 'Bir hata oluştu.');
        setStep(3);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  // === RENDER STEPS ===
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="border-0 bg-white/10 backdrop-blur-xl shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-white text-xl">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <Upload className="h-6 w-6" />
                </div>
                CV PDF Dosyasını Yükleyin
              </CardTitle>
              <p className="text-sm text-white/70 mt-2">
                CV'nizi PDF formatında yükleyin. Otomatik olarak analiz edilecek.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-white/30 rounded-2xl p-12 text-center cursor-pointer hover:border-cyan-400/50 hover:bg-white/5 transition-all duration-300"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const droppedFile = e.dataTransfer.files[0];
                    if (droppedFile?.type === 'application/pdf') {
                      setFile(droppedFile);
                      setError('');
                      setProgress(10);
                      await parsePDF(droppedFile);
                    } else {
                      setError('Lütfen PDF dosyası yükleyin');
                    }
                  }}
                >
                  <div className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl w-fit mx-auto mb-4">
                    <FileUp className="h-12 w-12 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    CV PDF'ini Sürükleyip Bırakın
                  </h3>
                  <p className="text-sm text-white/60 mb-4">
                    veya dosya seçmek için tıklayın
                  </p>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-cyan-500/30">
                    <Upload className="h-4 w-4 mr-2" />
                    Dosya Seç
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {file && (
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/30 rounded-lg">
                          <FileText className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{file.name}</p>
                          <p className="text-sm text-emerald-300">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg shadow-emerald-500/30"
                      onClick={() => file && parsePDF(file)}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      CV'yi Analiz Et
                    </Button>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-sm text-white/50 mb-3">veya</p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        pdfPath: '',
                        languages: [{ name: 'Türkçe', level: 'Ana dil' }]
                      }));
                      setStep(3);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/30 hover:brightness-110"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Manuel Bilgi Girişi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="border-0 bg-white/10 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                CV Analiz Ediliyor...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">İlerleme</span>
                    <span className="text-cyan-400 font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {[
                    { icon: User, label: 'Kişisel', color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/20' },
                    { icon: GraduationCap, label: 'Eğitim', color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/20' },
                    { icon: Briefcase, label: 'Deneyim', color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-600/20' },
                    { icon: Code, label: 'Yetenekler', color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/20' }
                  ].map((item, idx) => (
                    <div key={idx} className="text-center">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${item.bg} mx-auto mb-2 w-fit ${
                        progress > (idx + 1) * 25 ? 'ring-2 ring-emerald-400/50' : ''
                      }`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <p className="text-xs font-medium text-white/70">{item.label}</p>
                      {progress > (idx + 1) * 25 && (
                        <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto mt-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-2xl p-6 shadow-2xl">
              <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <User className="h-6 w-6" />
                </div>
                CV Bilgilerini Kontrol Edin
              </h1>
              <p className="text-white/80 mt-2">
                Otomatik çıkarılan bilgileri kontrol edin ve gerekirse düzenleyin
              </p>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {formData.parseScore > 0 && (
                  <Badge className="bg-white/20 text-white border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Doğruluk: %{formData.parseScore.toFixed(0)}
                  </Badge>
                )}
                <Badge variant="outline" className="bg-white/10 border-white/30 text-white">
                  {formData.skills.length} Yetenek
                </Badge>
                <Badge variant="outline" className="bg-white/10 border-white/30 text-white">
                  {formData.experience.length} Deneyim
                </Badge>
                <Badge variant="outline" className="bg-white/10 border-white/30 text-white">
                  {formData.education.length} Eğitim
                </Badge>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Kişisel Bilgiler */}
            <Card className="border-0 bg-white/10 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="p-1.5 bg-blue-500/20 rounded-lg">
                    <User className="h-4 w-4 text-blue-400" />
                  </div>
                  Kişisel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-white/80 flex items-center gap-1">
                      Ad Soyad <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={formData.fullname}
                      onChange={(e) => handleInputChange('fullname', e.target.value)}
                      className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                      placeholder="Adınız Soyadınız"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/80 flex items-center gap-1">
                      E-posta <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                      placeholder="ornek@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/80">Telefon</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                      placeholder="+90 5XX XXX XX XX"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/80">Doğum Tarihi</label>
                    <Input
                      value={formData.birthdate}
                      onChange={(e) => handleInputChange('birthdate', e.target.value)}
                      className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                      placeholder="1989 (35 Yaş)"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-white/80">Özet / Hakkımda</label>
                    <Textarea
                      value={formData.summary}
                      onChange={(e) => handleInputChange('summary', e.target.value)}
                      className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                      rows={3}
                      placeholder="Kendinizi kısaca tanıtın..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Yetenekler */}
            <Card className="border-0 bg-white/10 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/20 rounded-lg">
                      <Code className="h-4 w-4 text-purple-400" />
                    </div>
                    Teknik Yetenekler
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addArrayItem('skills', { name: '', level: 'Orta' })}
                    className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/20"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ekle
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.skills.length === 0 ? (
                    <p className="text-white/50 text-sm text-center py-4">
                      Henüz yetenek eklenmedi.
                    </p>
                  ) : (
                    formData.skills.map((skill, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                        <Input
                          value={skill.name}
                          onChange={(e) => updateArrayField('skills', index, 'name', e.target.value)}
                          className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                          placeholder="Yetenek adı"
                        />
                        <select
                          value={skill.level}
                          onChange={(e) => updateArrayField('skills', index, 'level', e.target.value)}
                          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                        >
                          <option value="Başlangıç">Başlangıç</option>
                          <option value="Orta">Orta</option>
                          <option value="İleri">İleri</option>
                          <option value="Uzman">Uzman</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem('skills', index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Eğitim */}
            <Card className="border-0 bg-white/10 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                      <GraduationCap className="h-4 w-4 text-emerald-400" />
                    </div>
                    Eğitim Bilgileri
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addArrayItem('education', { school: '', degree: '', department: '', startDate: '', endDate: '' })}
                    className="text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/20"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ekle
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.education.length === 0 ? (
                    <p className="text-white/50 text-sm text-center py-4">
                      Henüz eğitim bilgisi eklenmedi.
                    </p>
                  ) : (
                    formData.education.map((edu, index) => (
                      <div key={index} className="p-4 bg-white/5 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-emerald-400 font-medium">Eğitim #{index + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeArrayItem('education', index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            value={edu.school}
                            onChange={(e) => updateArrayField('education', index, 'school', e.target.value)}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                            placeholder="Okul/Üniversite"
                          />
                          <Input
                            value={edu.department}
                            onChange={(e) => updateArrayField('education', index, 'department', e.target.value)}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                            placeholder="Bölüm"
                          />
                          <Input
                            value={edu.degree}
                            onChange={(e) => updateArrayField('education', index, 'degree', e.target.value)}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                            placeholder="Derece (Lisans, Yüksek Lisans vb.)"
                          />
                          <div className="flex gap-2">
                            <Input
                              value={edu.startDate}
                              onChange={(e) => updateArrayField('education', index, 'startDate', e.target.value)}
                              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                              placeholder="Başlangıç"
                            />
                            <Input
                              value={edu.endDate}
                              onChange={(e) => updateArrayField('education', index, 'endDate', e.target.value)}
                              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                              placeholder="Bitiş"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* İş Deneyimi */}
            <Card className="border-0 bg-white/10 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/20 rounded-lg">
                      <Briefcase className="h-4 w-4 text-amber-400" />
                    </div>
                    İş Deneyimi
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addArrayItem('experience', { company: '', title: '', startDate: '', endDate: '', isCurrent: false, description: '' })}
                    className="text-amber-300 hover:text-amber-200 hover:bg-amber-500/20"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ekle
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.experience.length === 0 ? (
                    <p className="text-white/50 text-sm text-center py-4">
                      Henüz iş deneyimi eklenmedi.
                    </p>
                  ) : (
                    formData.experience.map((exp, index) => (
                      <div key={index} className="p-4 bg-white/5 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-amber-400 font-medium">Deneyim #{index + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeArrayItem('experience', index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            value={exp.company}
                            onChange={(e) => updateArrayField('experience', index, 'company', e.target.value)}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                            placeholder="Şirket Adı"
                          />
                          <Input
                            value={exp.title}
                            onChange={(e) => updateArrayField('experience', index, 'title', e.target.value)}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                            placeholder="Pozisyon"
                          />
                          <Input
                            value={exp.startDate}
                            onChange={(e) => updateArrayField('experience', index, 'startDate', e.target.value)}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                            placeholder="Başlangıç (Ocak 2018)"
                          />
                          <Input
                            value={exp.isCurrent ? '' : exp.endDate}
                            onChange={(e) => updateArrayField('experience', index, 'endDate', e.target.value)}
                            disabled={exp.isCurrent}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 disabled:opacity-60"
                            placeholder="Bitiş (Devam ediyor ise boş bırakın)"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={exp.isCurrent}
                            onChange={(e) => updateArrayField('experience', index, 'isCurrent', e.target.checked)}
                            className="rounded text-amber-500"
                          />
                          <label className="text-sm text-white/80">Devam ediyor</label>
                        </div>
                        <Textarea
                          value={exp.description}
                          onChange={(e) => updateArrayField('experience', index, 'description', e.target.value)}
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                          placeholder="Açıklama (isteğe bağlı)"
                          rows={2}
                        />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Diller */}
            <Card className="border-0 bg-white/10 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                      <Globe className="h-4 w-4 text-cyan-400" />
                    </div>
                    Diller
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addArrayItem('languages', { name: '', level: 'Orta' })}
                    className="text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/20"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ekle
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.languages.length === 0 ? (
                    <p className="text-white/50 text-sm text-center py-4">
                      Dil bilgisi eklenmedi.
                    </p>
                  ) : (
                    formData.languages.map((lang, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                        <Input
                          value={lang.name}
                          onChange={(e) => updateArrayField('languages', index, 'name', e.target.value)}
                          className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                          placeholder="Dil (örn. İngilizce)"
                        />
                        <select
                          value={lang.level}
                          onChange={(e) => updateArrayField('languages', index, 'level', e.target.value)}
                          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                        >
                          <option value="Başlangıç">Başlangıç</option>
                          <option value="Orta">Orta</option>
                          <option value="İleri">İleri</option>
                          <option value="Ana dil">Ana dil</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem('languages', index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setStep(1);
                  setFile(null);
                  setError('');
                }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-300/70 hover:brightness-110 shadow-md shadow-cyan-500/30"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Geri (CV Yükle)
              </Button>
              <Button
                onClick={submitCV}
                disabled={loading}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg shadow-emerald-500/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    CV'yi Gönder
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <Card className="border-0 bg-white/10 backdrop-blur-xl shadow-2xl">
            <CardContent className="py-12">
              <div className="text-center">
                {loading ? (
                  <>
                    <div className="p-4 bg-blue-500/20 rounded-2xl w-fit mx-auto mb-6">
                      <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">CV Gönderiliyor...</h2>
                    <p className="text-white/60">Lütfen bekleyin</p>
                  </>
                ) : success ? (
                  <>
                    <div className="p-4 bg-emerald-500/20 rounded-2xl w-fit mx-auto mb-6">
                      <CheckCircle className="h-12 w-12 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Başarılı! 🎉</h2>
                    <p className="text-emerald-300">{success}</p>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-red-500/20 rounded-2xl w-fit mx-auto mb-6">
                      <AlertCircle className="h-12 w-12 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Hata Oluştu</h2>
                    <p className="text-red-300 mb-4">{error}</p>
                    <Button
                      onClick={() => setStep(3)}
                      variant="ghost"
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-300/70 hover:brightness-110 shadow-md shadow-cyan-500/30"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Düzenlemeye Geri Dön
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 md:p-8">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                  <FileUp className="h-6 w-6" />
                </div>
                CV Yükle & Başvuru
              </h1>
              <p className="text-white/60 mt-2 text-sm md:text-base">
                CV'nizi yükleyin, otomatik analiz edelim ve başvurunuzu tamamlayın
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-300/70 hover:brightness-110 shadow-md shadow-cyan-500/30"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Giriş Sayfası</span>
            </Button>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
              <div
                className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
              {[
                { number: 1, label: 'Yükle', icon: Upload },
                { number: 2, label: 'Analiz', icon: Zap },
                { number: 3, label: 'Düzenle', icon: Edit2 },
                { number: 4, label: 'Gönder', icon: CheckCircle }
              ].map((item, index) => (
                <div key={index} className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    step > item.number
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : step === item.number
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-500/30'
                      : 'bg-slate-800 border-white/20 text-white/40'
                  }`}>
                    {step > item.number ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : step === item.number && item.number === 2 ? (
                      <item.icon className="h-5 w-5 animate-pulse" />
                    ) : (
                      <item.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`text-xs font-medium mt-2 ${
                    step >= item.number ? 'text-cyan-300' : 'text-white/40'
                  }`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <main>
          {renderStep()}
        </main>

        <footer className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-white/40">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>© {new Date().getFullYear()} H&R CV Başvuru Sistemi</span>
          </div>
          <p className="text-[10px] text-white/30 mt-1">
            CV'niz güvenli bir şekilde işlenir ve saklanır
          </p>
        </footer>
      </div>
    </div>
  );
}