import assert from 'node:assert/strict';
import {contactEvidence} from '../lib/contact-evidence';
assert.deepEqual(contactEvidence('<p>tel:+111 mailto:fake@example.com</p><!-- <a href="tel:+111"> --><template><a href="tel:+222"></a></template><script>"<a href=\'mailto:fake@example.com\'>"</script><noscript><a href="tel:+333"></a></noscript><svg><a href="tel:+444"></a></svg>'),[]);
assert.deepEqual(contactEvidence('<a href=tel:+123>Call</a><a HREF=" MAILTO:hello@example.com?subject=Question&amp;body=Test ">Email</a><a href="tel&#58;+456">Call</a>'),[
 {kind:'tel',target:'tel:+123',empty:false},
 {kind:'mailto',target:'mailto:hello@example.com',empty:false},
 {kind:'tel',target:'tel:+456',empty:false},
]);
assert.equal(contactEvidence('<a href="tel:">Call</a>')[0].empty,true);
assert.deepEqual(contactEvidence('<div href="tel:+1"></div><a data-contact="tel:+2"></a><a href="javascript:call()">Call</a><a href="/contact">Contact</a>'),[]);
console.log('Contact declarations: actual anchors, inert/foreign markup, entities, unquoted href, empty targets and no query retention passed.');
