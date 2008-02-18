
/**
 * Renders the default page template
 */
function renderPage() {
    res.writeln('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"\n\
       "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">');
    res.write(this.views.page.toXMLString()
        .replace(/;;ampersand;;/g,'&')
        .replace(/<textarea(.*)\/>/g,'<textarea$1></textarea>')
        .replace(/<script(.*)\/>/g,'<script$1></script>'));
}
