import { Image as ImageIcon, FileText, ExternalLink } from "lucide-react"

// Render file attachments if available
{submission.attachments && submission.attachments.length > 0 && (
  <div className="mt-8">
    <h3 className="text-lg font-medium mb-2">Attachments</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {submission.attachments.map((url, index) => {
        const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) !== null;
        
        if (isImage) {
          return (
            <div key={index} className="relative group rounded-md overflow-hidden border">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <div className="aspect-video relative">
                  <img 
                    src={url} 
                    alt={`Attachment ${index + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ExternalLink className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="p-2 bg-muted/50">
                  <span className="text-sm flex items-center">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    Attachment {index + 1}
                  </span>
                </div>
              </a>
            </div>
          );
        } else {
          return (
            <div key={index} className="border rounded-md p-4">
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex flex-col gap-2"
              >
                <div className="h-24 flex items-center justify-center bg-muted/50 rounded">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate flex-1">
                    Attachment {index + 1}
                  </span>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </div>
              </a>
            </div>
          );
        }
      })}
    </div>
  </div>
)} 