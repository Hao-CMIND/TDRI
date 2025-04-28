export default {
  disallowAttributeConcatenation: null,
  disallowAttributeInterpolation: true,
  disallowClassAttributeWithStaticValue: true,
  disallowClassLiteralsBeforeIdLiterals: true,
  disallowDuplicateAttributes: true,
  disallowHtmlText: null,
  disallowIdAttributeWithStaticValue: true,
  disallowLegacyMixinCall: true,
  disallowMultipleLineBreaks: true,
  disallowSpaceAfterCodeOperator: ['=', '!='],
  disallowSpacesInsideAttributeBrackets: true,
  // prettier-ignore
  disallowSpecificAttributes: ['align', 'alink', 'background', 'bgcolor', 'border', 'clear', 'compact', 'hspace', 'language', 'link', 'noshade', 'nowrap', 'start', 'text', 'vlink', 'vspace'],
  // prettier-ignore
  disallowSpecificTags: ['acronym', 'applet', 'b', 'basefont', 'big', 'blink', 'center', 'dir', 'embed', 'font', 'frame', 'frameset', 'i', 'isindex', 'noframes', 'marquee', 'menu', 'plaintext', 's', 'strike', 'tt', 'u'],
  disallowStringConcatenation: true,
  disallowTagInterpolation: null,
  disallowTrailingSpaces: true,
  requireClassLiteralsBeforeAttributes: true,
  requireIdLiteralsBeforeAttributes: true,
  requireLowerCaseAttributes: true,  //svg 特例
  requireSpaceAfterCodeOperator: ['-'],
  requireSpecificAttributes: [
    // { button: ['type'] },
    // { a: ['href', 'title'] },
    // { img: ['alt', 'src', 'width', 'height', 'loading'] },
    // { label: ['for'] },
    // { input: ['name', 'type'] },
    // { link: ['href', 'rel'] },
    // { svg: ['width', 'height'] }
  ],
  requireStrictEqualityOperators: true,
  validateAttributeQuoteMarks: "'",
  validateAttributeSeparator: {
    separator: ' ',
    multiLineSeparator: '\n  '
  },
  validateExtensions: true,
  validateLineBreaks: null,
  validateTemplateString: true,
  validateIndentation: 2
}
