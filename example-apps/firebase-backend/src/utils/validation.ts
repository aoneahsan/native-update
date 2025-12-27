import AdmZip from 'adm-zip';

export async function validateBundle(buffer: Buffer): Promise<{
  isValid: boolean;
  errors?: string[];
}> {
  const errors: string[] = [];
  
  try {
    // Check if it's a valid ZIP
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    
    if (entries.length === 0) {
      errors.push('Bundle is empty');
    }
    
    // Check for required files
    const hasManifest = entries.some(entry => entry.entryName === 'manifest.json');
    if (!hasManifest) {
      errors.push('Missing manifest.json');
    }
    
    // Check file size
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (buffer.length > maxSize) {
      errors.push(`Bundle size exceeds limit (${(buffer.length / 1024 / 1024).toFixed(2)}MB > 100MB)`);
    }
    
    // Validate manifest if present
    if (hasManifest) {
      const manifestEntry = entries.find(entry => entry.entryName === 'manifest.json');
      if (manifestEntry) {
        try {
          const manifestContent = manifestEntry.getData().toString('utf8');
          const manifest = JSON.parse(manifestContent);
          
          if (!manifest.version) {
            errors.push('Manifest missing version');
          }
          
          if (!manifest.files || !Array.isArray(manifest.files)) {
            errors.push('Manifest missing files array');
          }
        } catch (e) {
          errors.push('Invalid manifest.json format');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid ZIP file']
    };
  }
}