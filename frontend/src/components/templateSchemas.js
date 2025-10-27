export const TEMPLATE_SECTION_ORDER = ['content', 'design', 'actions', 'metadata', 'advanced'];

export const TEMPLATE_SECTION_TITLES = {
  content: 'Content',
  design: 'Design',
  actions: 'Actions',
  metadata: 'Metadata',
  advanced: 'Advanced'
};

const sharedHints = {
  pdfUpload: 'Accepts PDF files up to 25 MB. A thumbnail is generated automatically after upload.',
  audioUpload: 'Accepts MP3, AAC, or WAV files up to 20 MB. We transcode to MP3 for playback.',
  streamingLinks: 'Use the format Label|URL, one per line. Example: Spotify|https://open.spotify.com/...'
};

export const TEMPLATE_SCHEMAS = {
  PDF: {
    displayName: 'PDF template',
    fields: [
      {
        id: 'fileUrl',
        type: 'file',
        label: 'Upload PDF',
        section: 'content',
        hint: sharedHints.pdfUpload,
        accept: '.pdf',
        maxSize: 25 * 1024 * 1024,
        valueKey: 'fileUrl',
        fileNameKey: 'fileName'
      },
      {
        id: 'title',
        type: 'text',
        label: 'Document title',
        section: 'content',
        placeholder: 'Product brochure 2024'
      },
      {
        id: 'description',
        type: 'textarea',
        label: 'Short description',
        section: 'content',
        placeholder: 'Summarise what readers will find inside.'
      },
      {
        id: 'version',
        type: 'text',
        label: 'Version name',
        section: 'metadata',
        placeholder: 'v2.1'
      },
      {
        id: 'updatedAt',
        type: 'text',
        label: 'Last updated',
        section: 'metadata',
        placeholder: '2024-06-01'
      },
      {
        id: 'fileSize',
        type: 'text',
        label: 'File size label',
        section: 'metadata',
        placeholder: '2.3 MB'
      },
      {
        id: 'tags',
        type: 'text',
        label: 'Metadata tags',
        section: 'metadata',
        placeholder: 'Launch, Internal, V2'
      },
      {
        id: 'accentColor',
        type: 'color',
        label: 'Accent color',
        section: 'design',
        defaultValue: '#2563eb'
      },
      {
        id: 'backgroundColor',
        type: 'color',
        label: 'Background color',
        section: 'design',
        defaultValue: '#ffffff'
      },
      {
        id: 'textColor',
        type: 'color',
        label: 'Text color',
        section: 'design',
        defaultValue: '#000000'
      },
      {
        id: 'thumbnailUrl',
        type: 'text',
        label: 'Preview thumbnail URL',
        section: 'design',
        placeholder: 'https://.../thumb.png',
        advanced: true,
        hint: 'Optional override. We normally generate this from the first page.'
      },
      {
        id: 'notes',
        type: 'textarea',
        label: 'Version notes',
        section: 'metadata',
        placeholder: '✅ Added pricing updates\n⚙️ Updated installation steps'
      },
      {
        id: 'openInline',
        type: 'checkbox',
        label: 'Open in inline viewer by default',
        section: 'advanced',
        hint: 'When disabled, scanners download the PDF directly instead of opening the preview.',
        defaultValue: true
      }
    ]
  },
  MP3: {
    displayName: 'Music template',
    fields: [
      {
        id: 'fileUrl',
        type: 'file',
        label: 'Upload audio',
        section: 'content',
        hint: sharedHints.audioUpload,
        accept: '.mp3,.aac,.wav',
        maxSize: 20 * 1024 * 1024,
        valueKey: 'fileUrl',
        fileNameKey: 'fileName'
      },
      {
        id: 'title',
        type: 'text',
        label: 'Track title',
        section: 'content',
        placeholder: 'Single name'
      },
      {
        id: 'artist',
        type: 'text',
        label: 'Artist',
        section: 'content',
        placeholder: 'Artist name'
      },
      {
        id: 'album',
        type: 'text',
        label: 'Album or release',
        section: 'content',
        placeholder: 'Album title (optional)'
      },
      {
        id: 'description',
        type: 'textarea',
        label: 'Track description',
        section: 'content',
        placeholder: 'Tell listeners what they should know.'
      },
      {
        id: 'coverUrl',
        type: 'text',
        label: 'Cover art URL',
        section: 'design',
        placeholder: 'https://.../cover.jpg'
      },
      {
        id: 'heroImage',
        type: 'text',
        label: 'Hero background URL',
        section: 'design',
        placeholder: 'https://.../background.jpg'
      },
      {
        id: 'accentColor',
        type: 'color',
        label: 'Accent color',
        section: 'design',
        defaultValue: '#38bdf8'
      },
      {
        id: 'backgroundColor',
        type: 'color',
        label: 'Background color',
        section: 'design',
        defaultValue: '#0f172a'
      },
      {
        id: 'textColor',
        type: 'color',
        label: 'Text color',
        section: 'design',
        defaultValue: '#e2e8f0'
      },
      {
        id: 'streamingLinks',
        type: 'textarea',
        label: 'Streaming links',
        section: 'actions',
        hint: sharedHints.streamingLinks,
        placeholder: 'Spotify|https://open.spotify.com/track/...'
      },
      {
        id: 'moreTracks',
        type: 'textarea',
        label: 'More from the artist',
        section: 'actions',
        placeholder: 'Acoustic Sessions|3:21|https://example.com/a'
      },
      {
        id: 'autoplay',
        type: 'checkbox',
        label: 'Autoplay when page loads',
        section: 'advanced',
        defaultValue: false
      },
      {
        id: 'loop',
        type: 'checkbox',
        label: 'Loop track',
        section: 'advanced',
        defaultValue: false
      },
      {
        id: 'showQueue',
        type: 'checkbox',
        label: 'Show “more from artist” carousel',
        section: 'advanced',
        defaultValue: true
      },
      {
        id: 'enableMiniPlayer',
        type: 'checkbox',
        label: 'Enable sticky mini-player on scroll',
        section: 'advanced',
        defaultValue: true
      }
    ]
  },
  Vcard: {
    displayName: 'vCard template',
    fields: [
      {
        id: 'first',
        type: 'text',
        label: 'First name',
        section: 'content',
        placeholder: 'Taylor'
      },
      {
        id: 'last',
        type: 'text',
        label: 'Last name',
        section: 'content',
        placeholder: 'Jordan'
      },
      {
        id: 'title',
        type: 'text',
        label: 'Title / role',
        section: 'content',
        placeholder: 'Marketing Director'
      },
      {
        id: 'org',
        type: 'text',
        label: 'Company or team',
        section: 'content',
        placeholder: 'Acme Inc.'
      },
      {
        id: 'bio',
        type: 'textarea',
        label: 'Short bio or welcome',
        section: 'content',
        placeholder: 'Share what you do, expertise areas, or a friendly intro.'
      },
      {
        id: 'avatarUrl',
        type: 'text',
        label: 'Avatar image URL',
        section: 'design',
        placeholder: 'https://.../headshot.jpg',
        hint: 'Square images at least 512x512 recommended for best quality.'
      },
      {
        id: 'phone',
        type: 'text',
        label: 'Primary phone',
        section: 'actions',
        placeholder: '+1 555 123 4567'
      },
      {
        id: 'email',
        type: 'text',
        label: 'Primary email',
        section: 'actions',
        placeholder: 'hello@example.com'
      },
      {
        id: 'url',
        type: 'text',
        label: 'Website or booking link',
        section: 'actions',
        placeholder: 'https://example.com'
      },
      {
        id: 'address',
        type: 'textarea',
        label: 'Mailing address',
        section: 'advanced',
        placeholder: '123 Main St; City; State; ZIP; Country',
        hint: 'Separate address components with semicolons for best vCard compatibility.'
      },
      {
        id: 'pronouns',
        type: 'text',
        label: 'Pronouns',
        section: 'advanced',
        placeholder: 'she/her'
      },
      {
        id: 'linkedin',
        type: 'text',
        label: 'LinkedIn URL',
        section: 'advanced',
        placeholder: 'https://linkedin.com/in/username'
      },
      {
        id: 'twitter',
        type: 'text',
        label: 'Twitter / X URL',
        section: 'advanced',
        placeholder: 'https://x.com/username'
      },
      {
        id: 'instagram',
        type: 'text',
        label: 'Instagram URL',
        section: 'advanced',
        placeholder: 'https://instagram.com/username'
      },
      {
        id: 'facebook',
        type: 'text',
        label: 'Facebook URL',
        section: 'advanced',
        placeholder: 'https://facebook.com/username'
      }
    ]
  },
  LinkTree: {
    displayName: 'Link hub template',
    fields: [
      {
        id: 'heroTitle',
        type: 'text',
        label: 'Hero title',
        section: 'content',
        placeholder: 'All our links in one place'
      },
      {
        id: 'heroSubtitle',
        type: 'text',
        label: 'Hero subtitle',
        section: 'content',
        placeholder: 'Let people know what they can do next.'
      },
      {
        id: 'intro',
        type: 'textarea',
        label: 'Intro message',
        section: 'content',
        placeholder: 'Share a friendly welcome or highlight what’s new.'
      },
      {
        id: 'primaryCtaLabel',
        type: 'text',
        label: 'Primary button label',
        section: 'actions',
        placeholder: 'Book a demo'
      },
      {
        id: 'primaryCtaUrl',
        type: 'text',
        label: 'Primary button link',
        section: 'actions',
        placeholder: 'https://example.com/demo'
      },
      {
        id: 'secondaryLinks',
        type: 'textarea',
        label: 'Additional links',
        section: 'actions',
        hint: 'One per line using Label|URL format. Example: Instagram|https://instagram.com/brand',
        placeholder: 'Instagram|https://instagram.com/brand\nPricing|https://example.com/pricing'
      },
      {
        id: 'accentColor',
        type: 'color',
        label: 'Accent color',
        section: 'design',
        defaultValue: '#6366f1'
      },
      {
        id: 'backgroundColor',
        type: 'color',
        label: 'Background color',
        section: 'design',
        defaultValue: '#ffffff'
      },
      {
        id: 'textColor',
        type: 'color',
        label: 'Text color',
        section: 'design',
        defaultValue: '#0f172a'
      },
      {
        id: 'backgroundImage',
        type: 'text',
        label: 'Background image URL',
        section: 'design',
        placeholder: 'https://.../hero.jpg'
      },
      {
        id: 'buttonStyle',
        type: 'text',
        label: 'Button style (rounded, pill, outline)',
        section: 'advanced',
        placeholder: 'rounded'
      },
      {
        id: 'showShareActions',
        type: 'checkbox',
        label: 'Show share buttons',
        section: 'advanced',
        defaultValue: true
      },
      {
        id: 'enableCopyAll',
        type: 'checkbox',
        label: 'Enable copy-all links button',
        section: 'advanced',
        defaultValue: false
      },
      {
        id: 'shareTitle',
        type: 'text',
        label: 'Social share title',
        section: 'metadata',
        placeholder: 'Tap to explore our world'
      },
      {
        id: 'shareDescription',
        type: 'textarea',
        label: 'Social share description',
        section: 'metadata',
        placeholder: 'Your one-stop hub for resources, events, and offers.'
      },
      {
        id: 'shareImage',
        type: 'text',
        label: 'Social share image URL',
        section: 'metadata',
        placeholder: 'https://.../share.jpg'
      }
    ]
  }
};

export function resolveFieldValue(values, field) {
  if (!values) return '';
  return values[field.id];
}
