/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { get } from 'lodash/fp';
import React from 'react';

import { asArrayIfExists } from '../../../common/lib/helpers';
import { getMockNetflowData } from '../../../common/mock';
import { TestProviders } from '../../../common/mock/test_providers';
import { ID_FIELD_NAME } from '../../../common/components/event_details/event_id';
import { DESTINATION_IP_FIELD_NAME, SOURCE_IP_FIELD_NAME } from '../ip';
import { DESTINATION_PORT_FIELD_NAME, SOURCE_PORT_FIELD_NAME } from '../port';
import * as i18n from '../../../timelines/components/timeline/body/renderers/translations';
import { useMountAppended } from '../../../common/utils/use_mount_appended';

import {
  getPorts,
  hasPorts,
  isIpFieldPopulated,
  SourceDestinationIp,
} from './source_destination_ip';
import {
  DESTINATION_GEO_CITY_NAME_FIELD_NAME,
  DESTINATION_GEO_CONTINENT_NAME_FIELD_NAME,
  DESTINATION_GEO_COUNTRY_ISO_CODE_FIELD_NAME,
  DESTINATION_GEO_COUNTRY_NAME_FIELD_NAME,
  DESTINATION_GEO_REGION_NAME_FIELD_NAME,
  SOURCE_GEO_CITY_NAME_FIELD_NAME,
  SOURCE_GEO_CONTINENT_NAME_FIELD_NAME,
  SOURCE_GEO_COUNTRY_ISO_CODE_FIELD_NAME,
  SOURCE_GEO_COUNTRY_NAME_FIELD_NAME,
  SOURCE_GEO_REGION_NAME_FIELD_NAME,
} from './geo_fields';

describe('SourceDestinationIp', () => {
  describe('#isIpFieldPopulated', () => {
    test('it returns true when type is `source` and sourceIp has an IP address', () => {
      expect(
        isIpFieldPopulated({
          destinationIp: undefined,
          sourceIp: ['10.1.1.1'],
          type: 'source',
        })
      ).toBe(true);
    });

    test('it returns true when type is `source` and sourceIp contains a mix of empty and non-empty IPs', () => {
      expect(
        isIpFieldPopulated({
          destinationIp: undefined,
          sourceIp: ['', '10.1.1.1'],
          type: 'source',
        })
      ).toBe(true);
    });

    test('it returns false when type is `source` and sourceIp is undefined', () => {
      expect(
        isIpFieldPopulated({
          destinationIp: [],
          sourceIp: undefined,
          type: 'source',
        })
      ).toBe(false);
    });

    test('it returns false when type is `source` and sourceIp is empty', () => {
      expect(
        isIpFieldPopulated({
          destinationIp: [],
          sourceIp: [],
          type: 'source',
        })
      ).toBe(false);
    });

    test('it returns false when type is `source` and sourceIp only contains an array of empty strings', () => {
      expect(
        isIpFieldPopulated({
          destinationIp: [],
          sourceIp: ['', ''],
          type: 'source',
        })
      ).toBe(false);
    });

    test('it returns true when type is `destination` and destinationIp has an IP address', () => {
      expect(
        isIpFieldPopulated({
          destinationIp: ['10.1.1.1'],
          sourceIp: undefined,
          type: 'destination',
        })
      ).toBe(true);
    });

    test('it returns true when type is `destination` and destinationIp contains a mix of empty and non-empty IPs', () => {
      expect(
        isIpFieldPopulated({
          destinationIp: ['', '10.1.1.1'],
          sourceIp: undefined,
          type: 'destination',
        })
      ).toBe(true);
    });

    test('it returns false when type is `destination` and destinationIp is undefined', () => {
      expect(
        isIpFieldPopulated({
          destinationIp: undefined,
          sourceIp: undefined,
          type: 'destination',
        })
      ).toBe(false);
    });

    test('it returns false when type is `destination` and destinationIp is empty', () => {
      expect(
        isIpFieldPopulated({
          destinationIp: [],
          sourceIp: undefined,
          type: 'destination',
        })
      ).toBe(false);
    });

    test('it returns false when type is `destination` and destinationIp only contains an array of empty strings', () => {
      expect(
        isIpFieldPopulated({
          destinationIp: ['', ''],
          sourceIp: undefined,
          type: 'destination',
        })
      ).toBe(false);
    });
  });

  describe('#getPorts', () => {
    test('it returns an array of ports when type is `source` and sourcePort contains numeric ports', () => {
      expect(
        getPorts({
          destinationPort: undefined,
          sourcePort: [80, 443],
          type: 'source',
        })
      ).toEqual(['80', '443']);
    });

    test('it returns an array of ports when type is `source` and sourcePort contains string ports', () => {
      expect(
        getPorts({
          destinationPort: undefined,
          sourcePort: ['80', '443'],
          type: 'source',
        })
      ).toEqual(['80', '443']);
    });

    test('it returns an empty array when type is `source` and sourcePort is undefined', () => {
      expect(
        getPorts({
          destinationPort: undefined,
          sourcePort: undefined,
          type: 'source',
        })
      ).toEqual([]);
    });

    test('it returns an empty array when type is `source` and sourcePort is empty', () => {
      expect(
        getPorts({
          destinationPort: undefined,
          sourcePort: [],
          type: 'source',
        })
      ).toEqual([]);
    });

    test('it returns an empty array when type is `source` and sourcePort only contains an array of empty strings', () => {
      expect(
        getPorts({
          destinationPort: undefined,
          sourcePort: ['', ''],
          type: 'source',
        })
      ).toEqual([]);
    });

    test('it returns an empty array when type is `source` and sourcePort only contains a null value', () => {
      expect(
        getPorts({
          destinationPort: [],
          sourcePort: [null], // test case was added based on real-world data
          type: 'source',
        })
      ).toEqual([]);
    });

    test('it returns an array of ports when type is `destination` and destinationPort contains numeric ports', () => {
      expect(
        getPorts({
          destinationPort: [80, 443],
          sourcePort: undefined,
          type: 'destination',
        })
      ).toEqual(['80', '443']);
    });

    test('it returns an array of ports when type is `destination` and destinationPort contains string ports', () => {
      expect(
        getPorts({
          destinationPort: ['80', '443'],
          sourcePort: undefined,
          type: 'destination',
        })
      ).toEqual(['80', '443']);
    });

    test('it returns an empty array when type is `destination` and destinationPort is undefined', () => {
      expect(
        getPorts({
          destinationPort: undefined,
          sourcePort: undefined,
          type: 'destination',
        })
      ).toEqual([]);
    });

    test('it returns an empty array when type is `destination` and destinationPort is empty', () => {
      expect(
        getPorts({
          destinationPort: [],
          sourcePort: undefined,
          type: 'destination',
        })
      ).toEqual([]);
    });

    test('it returns an empty array when type is `destination` and destinationPort only contains an array of empty strings', () => {
      expect(
        getPorts({
          destinationPort: ['', ''],
          sourcePort: undefined,
          type: 'destination',
        })
      ).toEqual([]);
    });

    test('it returns an empty array when type is `destination` and destinationPort only contains a null value', () => {
      expect(
        getPorts({
          destinationPort: [null], // test case was added based on real-world data
          sourcePort: [],
          type: 'destination',
        })
      ).toEqual([]);
    });
  });

  describe('#hasPorts', () => {
    test('it returns true when type is `source` and numeric source ports are provided', () => {
      expect(
        hasPorts({
          destinationPort: undefined,
          sourcePort: [80, 443],
          type: 'source',
        })
      ).toEqual(true);
    });

    test('it returns true when when type is `source` and string source ports are provided', () => {
      expect(
        hasPorts({
          destinationPort: undefined,
          sourcePort: ['80', '443'],
          type: 'source',
        })
      ).toEqual(true);
    });

    test('it returns false when when type is `source` and invalid source ports are provided', () => {
      expect(
        hasPorts({
          destinationPort: undefined,
          sourcePort: [null], // test case was added based on real-world data
          type: 'source',
        })
      ).toEqual(false);
    });

    test('it returns true when type is `destination` and numeric destination ports are provided', () => {
      expect(
        hasPorts({
          destinationPort: [80, 443],
          sourcePort: undefined,
          type: 'destination',
        })
      ).toEqual(true);
    });

    test('it returns true when when type is `destination` and string destination ports are provided', () => {
      expect(
        hasPorts({
          destinationPort: ['80', '443'],
          sourcePort: undefined,
          type: 'destination',
        })
      ).toEqual(true);
    });

    test('it returns false when when type is `destination` and null destination ports are provided', () => {
      expect(
        hasPorts({
          destinationPort: [null], // test case was added based on real-world data
          sourcePort: undefined,
          type: 'destination',
        })
      ).toEqual(false);
    });
  });
  describe.only('renders', () => {
    const mount = useMountAppended();
    const defaultProps = {
      contextId: 'test',
      destinationGeoContinentName: asArrayIfExists(
        get(DESTINATION_GEO_CONTINENT_NAME_FIELD_NAME, getMockNetflowData())
      ),
      destinationGeoCountryName: asArrayIfExists(
        get(DESTINATION_GEO_COUNTRY_NAME_FIELD_NAME, getMockNetflowData())
      ),
      destinationGeoCountryIsoCode: asArrayIfExists(
        get(DESTINATION_GEO_COUNTRY_ISO_CODE_FIELD_NAME, getMockNetflowData())
      ),
      destinationGeoRegionName: asArrayIfExists(
        get(DESTINATION_GEO_REGION_NAME_FIELD_NAME, getMockNetflowData())
      ),
      destinationGeoCityName: asArrayIfExists(
        get(DESTINATION_GEO_CITY_NAME_FIELD_NAME, getMockNetflowData())
      ),
      destinationIp: asArrayIfExists(get(DESTINATION_IP_FIELD_NAME, getMockNetflowData())),
      destinationPort: asArrayIfExists(get(DESTINATION_PORT_FIELD_NAME, getMockNetflowData())),
      eventId: get(ID_FIELD_NAME, getMockNetflowData()),
      sourceGeoContinentName: asArrayIfExists(
        get(SOURCE_GEO_CONTINENT_NAME_FIELD_NAME, getMockNetflowData())
      ),
      sourceGeoCountryName: asArrayIfExists(
        get(SOURCE_GEO_COUNTRY_NAME_FIELD_NAME, getMockNetflowData())
      ),
      sourceGeoCountryIsoCode: asArrayIfExists(
        get(SOURCE_GEO_COUNTRY_ISO_CODE_FIELD_NAME, getMockNetflowData())
      ),
      sourceGeoRegionName: asArrayIfExists(
        get(SOURCE_GEO_REGION_NAME_FIELD_NAME, getMockNetflowData())
      ),
      sourceGeoCityName: asArrayIfExists(
        get(SOURCE_GEO_CITY_NAME_FIELD_NAME, getMockNetflowData())
      ),
      sourceIp: undefined,
      sourcePort: asArrayIfExists(get(SOURCE_PORT_FIELD_NAME, getMockNetflowData())),
      timelineId: 'timeline-1',
      type: undefined,
    };
    test('it renders a `Source` label when type is `source` and (just) the sourceIp field is populated', () => {
      const diffProps = {
        sourceIp: asArrayIfExists(get(SOURCE_IP_FIELD_NAME, getMockNetflowData())),
        sourcePort: undefined,
        type: 'source',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(wrapper.find('[data-test-subj="source-label"]').first().text()).toEqual(i18n.SOURCE);
    });

    test('it renders a `Destination` label when type is `destination` and (just) the destinationIp field is populated', () => {
      const diffProps = {
        destinationPort: undefined,
        type: 'destination',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(wrapper.find('[data-test-subj="destination-label"]').first().text()).toEqual(
        i18n.DESTINATION
      );
    });

    test('it renders a `Source` label when type is `source` (just) the sourcePort field is populated', () => {
      const type = 'source';
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, type }} />
        </TestProviders>
      );

      expect(wrapper.find('[data-test-subj="source-label"]').first().text()).toEqual(i18n.SOURCE);
    });

    test('it renders a `Destination` label when type is `destination` and (just) the destinationPort field is populated', () => {
      const diffProps = {
        destinationIp: undefined,
        type: 'destination',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(wrapper.find('[data-test-subj="destination-label"]').first().text()).toEqual(
        i18n.DESTINATION
      );
    });

    test('it renders a `Source` label when type is `source` and both sourceIp and sourcePort are populated', () => {
      const diffProps = {
        sourceIp: asArrayIfExists(get(SOURCE_IP_FIELD_NAME, getMockNetflowData())),
        type: 'source',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(wrapper.find('[data-test-subj="source-label"]').first().text()).toEqual(i18n.SOURCE);
    });

    test('it renders a `Destination` label when type is `destination` and both destinationIp and destinationPort are populated', () => {
      const diffProps = {
        type: 'destination',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(wrapper.find('[data-test-subj="destination-label"]').first().text()).toEqual(
        i18n.DESTINATION
      );
    });

    test('it does NOT render a `Source` label when type is `source` and both sourceIp and sourcePort are empty', () => {
      const diffProps = {
        sourceIp: [],
        sourcePort: [],
        type: 'source',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(wrapper.exists('[data-test-subj="source-label"]')).toBe(false);
    });

    test('it does NOT render a `Destination` label when type is `destination` and both destinationIp and destinationPort are empty', () => {
      const diffProps = {
        destinationIp: [],
        destinationPort: [],
        type: 'destination',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(wrapper.exists('[data-test-subj="destination-label"]')).toBe(false);
    });

    test('it renders the expected source IP when type is `source`, and both sourceIp and sourcePort are populated', () => {
      const diffProps = {
        sourceIp: asArrayIfExists(get(SOURCE_IP_FIELD_NAME, getMockNetflowData())),
        type: 'source',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(wrapper.find('[data-test-subj="draggable-content-source.ip"]').first().text()).toEqual(
        '192.168.1.2'
      );
    });

    test('it renders the expected source IP when type is `source`, but the length of the sourceIp and sourcePort arrays is different', () => {
      const diffProps = {
        sourceIp: asArrayIfExists(get(SOURCE_IP_FIELD_NAME, getMockNetflowData())),
        sourcePort: [],
        type: 'source',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(wrapper.find('[data-test-subj="draggable-content-source.ip"]').first().text()).toEqual(
        '192.168.1.2'
      );
    });

    test('it renders the expected destination IP when type is `destination`, and both destinationIp and destinationPort are populated', () => {
      const diffProps = {
        type: 'destination',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(
        wrapper.find('[data-test-subj="draggable-content-destination.ip"]').first().text()
      ).toEqual('10.1.2.3');
    });

    test('it renders the expected destination IP when type is `destination`, but the length of the destinationIp and destinationPort port arrays is different', () => {
      const diffProps = {
        destinationPort: [],
        type: 'destination',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(
        wrapper.find('[data-test-subj="draggable-content-destination.ip"]').first().text()
      ).toEqual('10.1.2.3');
    });

    test('it renders the expected source port when type is `source`, and both sourceIp and sourcePort are populated', () => {
      const diffProps = {
        sourceIp: asArrayIfExists(get(SOURCE_IP_FIELD_NAME, getMockNetflowData())),
        type: 'source',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(
        wrapper.find('[data-test-subj="draggable-content-source.port"]').first().text()
      ).toEqual('9987');
    });

    test('it renders the expected destination port when type is `destination`, and both destinationIp and destinationPort are populated', () => {
      const diffProps = {
        type: 'destination',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(
        wrapper.find('[data-test-subj="draggable-content-destination.port"]').first().text()
      ).toEqual('80');
    });

    test('it renders the expected source port when type is `source`, but only sourcePort is populated', () => {
      const type = 'source';
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, type }} />
        </TestProviders>
      );

      expect(
        wrapper.find('[data-test-subj="draggable-content-source.port"]').first().text()
      ).toEqual('9987');
    });

    test('it renders the expected destination port when type is `destination`, and only destinationPort is populated', () => {
      const diffProps = {
        destinationIp: undefined,
        type: 'destination',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(
        wrapper.find('[data-test-subj="draggable-content-destination.port"]').first().text()
      ).toEqual('80');
    });

    test('it does NOT render the badge when type is `source`, but both sourceIp and sourcePort are undefined', () => {
      const type = 'source';
      const diffProps = {
        sourcePort: undefined,
        type,
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(wrapper.exists(`[data-test-subj="${type}-ip-badge"]`)).toBe(false);
    });

    test('it does NOT render the badge when type is `destination`, but both destinationIp and destinationPort are undefined', () => {
      const type = 'destination';
      const diffProps = {
        destinationIp: undefined,
        destinationPort: undefined,
        type,
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(wrapper.exists(`[data-test-subj="${type}-ip-badge"]`)).toBe(false);
    });

    test('it renders geo fields', () => {
      const diffProps = {
        type: 'source',
      };
      const wrapper = mount(
        <TestProviders>
          <SourceDestinationIp {...{ ...defaultProps, ...diffProps }} />
        </TestProviders>
      );

      expect(
        wrapper
          .find('[data-test-subj="draggable-content-source.geo.continent_name"]')
          .first()
          .text()
      ).toEqual('North America');
    });
  });
});
