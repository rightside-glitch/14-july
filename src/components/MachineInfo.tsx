import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Server,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface SystemDisk {
  device: string;
  type: string;
  name: string;
  size: number;
  serial: string;
}

interface SystemInfo {
  machine: {
    manufacturer: string;
    model: string;
    version: string;
    serial: string;
    uuid: string;
    sku: string;
    virtual: boolean;
  };
  cpu: {
    manufacturer: string;
    brand: string;
    cores: number;
    physicalCores: number;
    speed: number;
    cache: Record<string, unknown>;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    active: number;
    available: number;
  };
  os: {
    platform: string;
    distro: string;
    release: string;
    arch: string;
    hostname: string;
    codename: string;
    kernel: string;
    build: string;
  };
  storage: {
    disks: SystemDisk[];
  };
  graphics: {
    controllers: Array<{
      model: string;
      vendor: string;
      vram: number;
      driverVersion: string;
    }>;
  };
}

interface EmailValidationResult {
  email: string;
  isValid: boolean;
  type: 'real' | 'fake';
  confidence: 'high' | 'low';
  reasons: {
    isFake: boolean;
    isDisposable: boolean;
    realScore: number;
    indicators: {
      hasValidFormat: boolean;
      hasValidDomain: boolean;
      hasReasonableLength: boolean;
      notTestEmail: boolean;
      notDisposable: boolean;
    };
  };
}

interface MachineInfoProps {
  systemInfo: SystemInfo;
  validateEmail: (email: string) => Promise<EmailValidationResult | null>;
}

export const MachineInfo = ({ systemInfo, validateEmail }: MachineInfoProps) => {
  const [email, setEmail] = useState('');
  const [validationResult, setValidationResult] = useState<EmailValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleEmailValidation = async () => {
    if (!email.trim()) return;
    
    setIsValidating(true);
    try {
      const result = await validateEmail(email);
      setValidationResult(result);
    } catch (error) {
      console.error('Email validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMachineType = () => {
    if (!systemInfo?.machine) return 'Unknown';
    
    const { manufacturer, model, virtual } = systemInfo.machine;
    
    if (virtual) return 'Virtual Machine';
    if (manufacturer?.toLowerCase().includes('dell')) return 'Dell Computer';
    if (manufacturer?.toLowerCase().includes('hp')) return 'HP Computer';
    if (manufacturer?.toLowerCase().includes('lenovo')) return 'Lenovo Computer';
    if (manufacturer?.toLowerCase().includes('asus')) return 'ASUS Computer';
    if (manufacturer?.toLowerCase().includes('acer')) return 'Acer Computer';
    if (manufacturer?.toLowerCase().includes('apple')) return 'Apple Mac';
    if (manufacturer?.toLowerCase().includes('microsoft')) return 'Microsoft Surface';
    
    return `${manufacturer} ${model}`;
  };

  return (
    <div className="space-y-6">
      {/* Machine Information */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-400" />
            Machine Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemInfo?.machine ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Machine Details */}
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-400 text-sm">Machine Type</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="border-blue-500 text-blue-400">
                      {getMachineType()}
                    </Badge>
                    {systemInfo.machine.virtual && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                        Virtual
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-slate-400 text-sm">Manufacturer</Label>
                  <p className="text-white font-medium">{systemInfo.machine.manufacturer}</p>
                </div>
                
                <div>
                  <Label className="text-slate-400 text-sm">Model</Label>
                  <p className="text-white font-medium">{systemInfo.machine.model}</p>
                </div>
                
                <div>
                  <Label className="text-slate-400 text-sm">Version</Label>
                  <p className="text-white font-medium">{systemInfo.machine.version}</p>
                </div>
              </div>

              {/* System Details */}
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-400 text-sm">Hostname</Label>
                  <p className="text-white font-medium">{systemInfo.os.hostname}</p>
                </div>
                
                <div>
                  <Label className="text-slate-400 text-sm">Operating System</Label>
                  <p className="text-white font-medium">{systemInfo.os.distro} {systemInfo.os.release}</p>
                </div>
                
                <div>
                  <Label className="text-slate-400 text-sm">Architecture</Label>
                  <p className="text-white font-medium">{systemInfo.os.arch}</p>
                </div>
                
                <div>
                  <Label className="text-slate-400 text-sm">Kernel</Label>
                  <p className="text-white font-medium">{systemInfo.os.kernel}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">
              <Server className="h-12 w-12 mx-auto mb-4 text-slate-600" />
              <p>Machine information not available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hardware Specifications */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-green-400" />
            Hardware Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CPU */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-green-400" />
                  <Label className="text-slate-400 text-sm">Processor</Label>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">{systemInfo.cpu.brand}</p>
                  <p className="text-slate-400 text-sm">
                    {systemInfo.cpu.cores} cores ({systemInfo.cpu.physicalCores} physical)
                  </p>
                  <p className="text-slate-400 text-sm">
                    {systemInfo.cpu.speed} GHz
                  </p>
                </div>
              </div>

              {/* Memory */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-blue-400" />
                  <Label className="text-slate-400 text-sm">Memory</Label>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">{formatBytes(systemInfo.memory.total)}</p>
                  <p className="text-slate-400 text-sm">
                    {formatBytes(systemInfo.memory.used)} used
                  </p>
                  <p className="text-slate-400 text-sm">
                    {formatBytes(systemInfo.memory.available)} available
                  </p>
                </div>
              </div>

              {/* Storage */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-purple-400" />
                  <Label className="text-slate-400 text-sm">Storage</Label>
                </div>
                <div className="space-y-2">
                  {systemInfo.storage.disks.slice(0, 2).map((disk: SystemDisk, index: number) => (
                    <div key={index}>
                      <p className="text-white font-medium">{disk.name}</p>
                      <p className="text-slate-400 text-sm">{formatBytes(disk.size)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">
              <Cpu className="h-12 w-12 mx-auto mb-4 text-slate-600" />
              <p>Hardware information not available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Validation */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-cyan-400" />
            Email Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="email" className="text-slate-400 text-sm">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email to validate..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button
                onClick={handleEmailValidation}
                disabled={!email.trim() || isValidating}
                className="mt-6"
              >
                {isValidating ? 'Validating...' : 'Validate'}
              </Button>
            </div>

            {validationResult && (
              <Alert className={`border ${
                validationResult.type === 'real' 
                  ? 'border-green-500 bg-green-500/10' 
                  : 'border-red-500 bg-red-500/10'
              }`}>
                <div className="flex items-center gap-2">
                  {validationResult.type === 'real' ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                  <AlertDescription className="text-white">
                    <span className="font-medium">{validationResult.email}</span> is a{' '}
                    <span className={`font-bold ${
                      validationResult.type === 'real' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {validationResult.type} email
                    </span>
                    {' '}({validationResult.confidence} confidence)
                  </AlertDescription>
                </div>
                
                {validationResult.reasons && (
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Real Score:</span>{' '}
                        <span className="text-white">{validationResult.reasons.realScore}/10</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Disposable:</span>{' '}
                        <span className={validationResult.reasons.isDisposable ? 'text-red-400' : 'text-green-400'}>
                          {validationResult.reasons.isDisposable ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-400">
                      <div className="grid grid-cols-2 gap-2">
                        <div>✓ Valid Format: {validationResult.reasons.indicators.hasValidFormat ? 'Yes' : 'No'}</div>
                        <div>✓ Valid Domain: {validationResult.reasons.indicators.hasValidDomain ? 'Yes' : 'No'}</div>
                        <div>✓ Reasonable Length: {validationResult.reasons.indicators.hasReasonableLength ? 'Yes' : 'No'}</div>
                        <div>✓ Not Test Email: {validationResult.reasons.indicators.notTestEmail ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 