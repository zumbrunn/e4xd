
/**
 * Renders the default page template
 */
function renderPage() {
    res.writeln('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"\n\
       "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">');
    res.write(String.fromE4X(this.views.page));
}
