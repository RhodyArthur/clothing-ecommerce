import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { womenSizes, menSizes, womenShoes, menShoes } from '../../constants/size';

type SizeTab = 'women' | 'men' | 'kids' | 'shoes';

@Component({
  selector: 'app-size-guide',
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './size-guide.html',
})
export class SizeGuide {

  visible  = signal(false);
  activeTab = signal<SizeTab>('women');

  open():  void { this.visible.set(true);  }
  close(): void { this.visible.set(false); }
  setTab(tab: SizeTab): void { this.activeTab.set(tab); }

  tabs: { key: SizeTab; label: string; icon: string }[] = [
    { key: 'women', label: 'Women', icon: 'pi-user'        },
    { key: 'men',   label: 'Men',   icon: 'pi-user'        },
    { key: 'shoes', label: 'Shoes', icon: 'pi-comment'     }
  ];

  measureTips = [
    {
      icon:  'pi-user',
      label: 'Bust/Chest',
      desc:  'Measure around the fullest part of your bust/chest, keeping the tape parallel to the floor.'
    },
    {
      icon:  'pi-bookmark',
      label: 'Waist',
      desc:  'Measure around your natural waistline, typically the narrowest part of your torso.'
    },
    {
      icon:  'pi-arrows-h',
      label: 'Hips',
      desc:  'Measure around the fullest part of your hips, keeping the tape parallel to the floor.'
    }
  ];

  // Data imported from shared constants
  womenSizes = womenSizes;
  menSizes = menSizes;
  womenShoes = womenShoes;
  menShoes = menShoes;
}