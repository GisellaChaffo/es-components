import React, { useEffect } from 'react';
import styled from 'styled-components';
import { render, cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeComponent } from '../../util/test-utils';

import Drawer, {
  DrawerProps,
  ActiveKeys,
  useDrawerItemContext
} from './Drawer';

// Ensure styled panels always work
const StyledFirstPanel = styled(Drawer.Panel)`
  background-color: blue;
`;

function PanelDrawer<T extends ActiveKeys>(props: DrawerProps<T>) {
  return (
    <ThemeComponent>
      <Drawer className="important" {...props}>
        <StyledFirstPanel
          title="collapse 1"
          key="1"
          className="first"
          titleAside="side text"
        >
          first
        </StyledFirstPanel>
        <Drawer.Panel title="collapse 2" key="2" className="second" noPadding>
          second
        </Drawer.Panel>
        <Drawer.Panel title="collapse 3" key="3" className="third">
          third
        </Drawer.Panel>
      </Drawer>
    </ThemeComponent>
  );
}

beforeEach(cleanup);

describe('drawer', () => {
  it('active panel is opened', async () => {
    const onActiveKeysChanged = jest.fn<void, [string[]]>();
    render(
      <PanelDrawer
        onActiveKeysChanged={onActiveKeysChanged}
        activeKeys={['1']}
      />
    );

    (await screen.findAllByRole('region', { hidden: true })).forEach(
      (panel, index) => {
        const hidden = index === 0 ? 'false' : 'true';
        expect(panel).toHaveAttribute('aria-hidden', hidden);
      }
    );
  });

  it('allows multiple panels to be opened at the same time', async () => {
    const onActiveKeysChanged = jest.fn();
    render(
      <PanelDrawer
        onActiveKeysChanged={onActiveKeysChanged}
        activeKeys={['1', '3']}
      />
    );

    const regions = await screen.findAllByRole('region', { hidden: true });
    regions.forEach((panel, index) => {
      const hidden = index === 0 || index === 2 ? 'false' : 'true';
      expect(panel).toHaveAttribute('aria-hidden', hidden);
    });
  });
});

describe('accordion', () => {
  it('should only allow one drawer to be opened at a time', async () => {
    const onActiveKeysChanged = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let theRerender = (ui: React.ReactElement) => {
      // noop
    };
    onActiveKeysChanged.mockImplementation((newActiveKeys: string | string[]) =>
      theRerender(
        <PanelDrawer
          isAccordion
          onActiveKeysChanged={onActiveKeysChanged}
          activeKeys={newActiveKeys}
        />
      )
    );
    const { rerender } = render(
      <PanelDrawer
        isAccordion
        onActiveKeysChanged={onActiveKeysChanged}
        activeKeys={['1', '2']}
      />
    );
    theRerender = rerender;

    const regions = await screen.findAllByRole('region', { hidden: true });
    regions.forEach((panel, index) => {
      const hidden = index === 0 ? 'false' : 'true';
      expect(panel).toHaveAttribute('aria-hidden', hidden);
    });
  });
});

describe('Drawer.Item functionality', () => {
  const ItemTracker = ({
    trackDrawerChange
  }: {
    trackDrawerChange: (isOpen: boolean) => void;
  }) => {
    const { open } = useDrawerItemContext();
    useEffect(() => {
      trackDrawerChange(open);
    }, [open, trackDrawerChange]);

    return <></>;
  };

  const TestItemDrawer = ({
    openItems = [],
    onDrawersChange = [],
    ...props
  }: DrawerProps & {
    openItems?: boolean[];
    onDrawersChange?: ((isOpen: boolean) => void)[];
  }) => (
    <ThemeComponent>
      <Drawer className="important" {...props}>
        <div>
          <Drawer.Item open={openItems[0]}>
            <ItemTracker
              trackDrawerChange={isOpen => onDrawersChange[0]?.(isOpen)}
            />
            <Drawer.ItemOpener>
              <button type="button">collapse 1</button>
            </Drawer.ItemOpener>
            <Drawer.ItemBody className="first">first</Drawer.ItemBody>
          </Drawer.Item>
        </div>
        <Drawer.Item open={openItems[1]}>
          <ItemTracker
            trackDrawerChange={isOpen => onDrawersChange[1]?.(isOpen)}
          />
          <Drawer.ItemOpener>
            <button type="button">collapse 2</button>
          </Drawer.ItemOpener>
          <Drawer.ItemBody className="second">second</Drawer.ItemBody>
        </Drawer.Item>
        <Drawer.Item open={openItems[2]}>
          <ItemTracker
            trackDrawerChange={isOpen => onDrawersChange[2]?.(isOpen)}
          />
          <Drawer.ItemOpener>
            <button type="button">collapse 3</button>
          </Drawer.ItemOpener>
          <Drawer.ItemBody className="third">third</Drawer.ItemBody>
        </Drawer.Item>
      </Drawer>
    </ThemeComponent>
  );

  /* eslint-disable testing-library/no-node-access */
  it('can open from a click', async () => {
    render(<TestItemDrawer />);

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'true'
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /collapse 1/ })
    );

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'false'
    );
  });

  it('can close from a click', async () => {
    render(<TestItemDrawer />);

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'true'
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /collapse 1/ })
    );

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'false'
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /collapse 1/ })
    );

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('can open from a prop', async () => {
    render(<TestItemDrawer openItems={[true]} />);

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'false'
    );
  });

  it('can close from a prop', async () => {
    const { rerender } = render(<TestItemDrawer openItems={[true]} />);

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'false'
    );

    rerender(<TestItemDrawer openItems={[false]} />);

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('reopens from a prop after a click', async () => {
    let open = true;
    const onDrawersChange = (isOpen: boolean) => {
      open = isOpen;
    };
    const getTestDrawer = (newOpen?: boolean) => (
      <TestItemDrawer
        openItems={[typeof newOpen !== 'undefined' ? newOpen : open]}
        onDrawersChange={[onDrawersChange]}
      />
    );

    const { rerender } = render(getTestDrawer());

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'false'
    );

    await userEvent.click(await screen.findByText('collapse 1'));

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'true'
    );

    // rerender so prop matches current state (closed after click)
    rerender(getTestDrawer());

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'true'
    );

    // rerender to open again
    rerender(getTestDrawer(true));

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'false'
    );
  });

  it('matches correctly from prop to click', async () => {
    const { rerender } = render(<TestItemDrawer openItems={[true]} />);

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'false'
    );

    await userEvent.click(await screen.findByText('collapse 1'));

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'true'
    );

    rerender(<TestItemDrawer openItems={[false]} />);

    expect((await screen.findByText('first')).parentElement).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });
});
