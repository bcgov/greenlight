import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';
import { RecipeComponent } from './components/recipe/recipe.component';
import { SearchInputComponent } from './components/search/search-input/search-input.component';
import { WorkflowStepComponent } from './components/workflow/workflow-step/workflow-step.component';
import { GeneralDataService } from './services/general-data.service';
import { ProgressBarComponent } from './components/util/progress-bar/progress-bar.component';
import { AlertComponent } from './components/util/alert/alert.component';
import { AboutComponent } from './components/about/about.component';



@NgModule({
  declarations: [
    AppComponent,
    FooterComponent,
    HeaderComponent,
    HomeComponent,
    RecipeComponent,
    WorkflowStepComponent,
    SearchInputComponent,
    ProgressBarComponent,
    AlertComponent,
    AboutComponent
  ],
  entryComponents: [
    WorkflowStepComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    NgbModule,
    NgSelectModule
  ],
  providers: [
    GeneralDataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
