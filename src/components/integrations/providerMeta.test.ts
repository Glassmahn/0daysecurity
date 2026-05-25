import { describe, it, expect } from 'vitest';
import { PROVIDER_META, CATEGORY_ORDER } from './providerMeta';

describe('PROVIDER_META', () => {
  it('has entries for all 12 providers', () => {
    expect(Object.keys(PROVIDER_META)).toHaveLength(12);
  });

  const requiredFields: (keyof (typeof PROVIDER_META)[string])[] = ['label', 'category', 'description', 'docsUrl', 'fields', 'testable'];

  for (const [key, meta] of Object.entries(PROVIDER_META)) {
    describe(`${key} (${meta.label})`, () => {
      for (const field of requiredFields) {
        it(`has required field "${field}"`, () => {
          expect(meta).toHaveProperty(field);
        });
      }

      it('has a valid docs URL', () => {
        expect(meta.docsUrl).toMatch(/^https?:\/\//);
      });

      it('has at least one config field', () => {
        expect(meta.fields.length).toBeGreaterThan(0);
      });

      it('every field has key, label, placeholder, and type', () => {
        for (const f of meta.fields) {
          expect(f).toHaveProperty('key');
          expect(f).toHaveProperty('label');
          expect(f).toHaveProperty('placeholder');
          expect(['text', 'password', 'url']).toContain(f.type);
        }
      });

      it('has a valid category in CATEGORY_ORDER', () => {
        expect(CATEGORY_ORDER).toContain(meta.category);
      });
    });
  }

  describe('testable providers', () => {
    const testableProviders = Object.entries(PROVIDER_META).filter(([, m]) => m.testable);

    it('testable providers have either URL or connection fields', () => {
      for (const [, meta] of testableProviders) {
        expect(meta.fields.length).toBeGreaterThan(0);
      }
    });

    it('aws, crowdstrike, gcp, jamf, jira, okta, qualys, slack are testable', () => {
      const names = testableProviders.map(([k]) => k).sort();
      expect(names).toEqual(['aws', 'crowdstrike', 'gcp', 'jamf', 'jira', 'okta', 'qualys', 'slack'].sort());
    });
  });

  describe('non-testable providers', () => {
    const nonTestable = Object.entries(PROVIDER_META).filter(([, m]) => !m.testable);

    it('github, datadog, vanta, pagerduty are non-testable', () => {
      const names = nonTestable.map(([k]) => k).sort();
      expect(names).toEqual(['datadog', 'github', 'pagerduty', 'vanta'].sort());
    });

    it('non-testable providers have no URL field type', () => {
      for (const [, meta] of nonTestable) {
        const hasUrlField = meta.fields.some(f => f.type === 'url');
        expect(hasUrlField).toBe(false);
      }
    });
  });

  describe('CATEGORY_ORDER', () => {
    it('covers all unique categories from provider metadata', () => {
      const uniqueCategories = [...new Set(Object.values(PROVIDER_META).map(m => m.category))];
      for (const cat of uniqueCategories) {
        expect(CATEGORY_ORDER).toContain(cat);
      }
    });

    it('has no duplicate entries', () => {
      expect(new Set(CATEGORY_ORDER).size).toBe(CATEGORY_ORDER.length);
    });
  });
});
